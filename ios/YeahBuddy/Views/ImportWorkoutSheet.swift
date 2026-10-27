import SwiftUI
import PhotosUI
import UniformTypeIdentifiers
import Vision

/// Type, paste, or upload (text file / photo of notes) a finished workout and add it to history.
struct ImportWorkoutSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var text = ""
    @State private var drafts: [Draft] = []
    @State private var step: Step = .input
    @State private var showFile = false
    @State private var photo: PhotosPickerItem?
    @State private var busy = false
    @State private var message: String?

    enum Step { case input, review }

    struct DraftExercise: Identifiable {
        let id = UUID()
        var name: String
        var typed: String
        var isNew: Bool
        var sets: [LoggedSet]
    }

    struct Draft: Identifiable {
        let id = UUID()
        var date: Date
        var name: String
        var split: String
        var exercises: [DraftExercise]
    }

    var body: some View {
        NavigationStack {
            Group {
                if step == .input { inputView } else { reviewView }
            }
            .screenBackground()
            .navigationTitle(step == .input ? "Log a Workout" : "Check & Add")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button {
                        if step == .review { withAnimation { step = .input } } else { dismiss() }
                    } label: { Image(systemName: step == .review ? "chevron.left" : "xmark") }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if step == .input {
                        Button("Next") { review() }.disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    } else {
                        Button("Add") { save() }.disabled(drafts.isEmpty)
                    }
                }
            }
            .fileImporter(isPresented: $showFile, allowedContentTypes: [.plainText, .text, .utf8PlainText, .commaSeparatedText]) { result in
                guard case .success(let url) = result else { return }
                let scoped = url.startAccessingSecurityScopedResource()
                defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                if let t = try? String(contentsOf: url, encoding: .utf8) { text = t; message = nil }
                else { message = "Couldn't read that file" }
            }
            .onChange(of: photo) { _, item in
                guard let item else { return }
                Task { await readPhoto(item) }
            }
        }
    }

    // MARK: - Step 1: text in

    private var inputView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Type or paste a workout, or load it from a text file or a photo of your notes.")
                    .font(.system(size: 13)).foregroundStyle(Theme.soft)

                HStack(spacing: 8) {
                    // System paste button: reads the clipboard without the "Allow Paste" prompt.
                    PasteButton(payloadType: String.self) { strings in
                        Task { @MainActor in text = strings.joined(separator: "\n"); message = nil }
                    }
                    .labelStyle(.titleAndIcon)
                    .buttonBorderShape(.roundedRectangle(radius: 10))
                    .tint(Theme.green.opacity(0.25))
                    .frame(maxWidth: .infinity)
                    sourceButton("File", "doc.text") { showFile = true }
                    PhotosPicker(selection: $photo, matching: .images) {
                        sourceLabel("Photo", "camera")
                    }
                    .buttonStyle(.plain)
                }

                ZStack(alignment: .topLeading) {
                    if text.isEmpty {
                        Text(example).font(.system(size: 14, design: .monospaced)).foregroundStyle(Theme.dim)
                            .padding(.horizontal, 17).padding(.vertical, 20)
                    }
                    TextEditor(text: $text)
                        .font(.system(size: 14, design: .monospaced))
                        .scrollContentBackground(.hidden)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .padding(12)
                        .frame(minHeight: 320)
                }
                .card(radius: 12)
                .overlay { if busy { ProgressView("Reading photo…").tint(Theme.green).foregroundStyle(Theme.soft) } }

                if let message { Text(message).font(.system(size: 12)).foregroundStyle(Theme.red) }

                Text("A date line starts a workout. Under each exercise, one set per line: \"15\" = 15 reps (bodyweight if the name says BW), \"15x40\" = 15 reps × 40 lb, \"4x10@135\" = 4 sets of 10 at 135. Sets can also go on one line: \"15x40, 15x50\".")
                    .font(.system(size: 12)).foregroundStyle(Theme.muted)
            }
            .padding(16)
        }
    }

    private let example = "Workout 10/26\nDips BW\n15\n15\n10\n\nCable kickback\n15x15\n15x15"

    private func sourceButton(_ title: String, _ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) { sourceLabel(title, icon) }.buttonStyle(.plain)
    }

    private func sourceLabel(_ title: String, _ icon: String) -> some View {
        Label(title, systemImage: icon)
            .font(.system(size: 13, weight: .semibold))
            .frame(maxWidth: .infinity).padding(.vertical, 10)
            .foregroundStyle(Theme.green)
            .background(Theme.green.opacity(0.13), in: RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Step 2: review

    private var reviewView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if drafts.isEmpty {
                    EmptyState(icon: "questionmark.circle", text: "Couldn't find any sets in that text.\nGo back and check the format.")
                }
                ForEach($drafts) { $d in
                    VStack(alignment: .leading, spacing: 10) {
                        DatePicker("Date", selection: $d.date, in: ...Date(), displayedComponents: .date)
                            .font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                            .tint(Theme.green)
                        TextField("Workout name (optional)", text: $d.name)
                            .font(.system(size: 14)).padding(10).background(Theme.field, in: RoundedRectangle(cornerRadius: 8))
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(ExerciseCatalog.splits + ["custom"], id: \.self) { s in
                                    Pill(text: ExerciseCatalog.splitLabel(s), selected: d.split == s) { d.split = s }
                                }
                            }
                        }
                        ForEach($d.exercises) { $ex in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    TextField("Exercise", text: $ex.name)
                                        .font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                                        .onChange(of: ex.name) { _, n in ex.isNew = !knownNames.contains(n) }
                                    if ex.isNew { Tag(text: "NEW", color: Theme.gold) }
                                    Button { d.exercises.removeAll { $0.id == ex.id } } label: {
                                        Image(systemName: "xmark").font(.system(size: 12)).foregroundStyle(Theme.muted)
                                    }
                                    .buttonStyle(.plain)
                                }
                                if ex.name.caseInsensitiveCompare(ex.typed) != .orderedSame {
                                    Text("You wrote \"\(ex.typed)\"").font(.system(size: 11)).foregroundStyle(Theme.muted)
                                }
                                Text(ex.sets.map(setLabel).joined(separator: "   "))
                                    .font(.system(size: 13, design: .monospaced)).foregroundStyle(Theme.soft)
                            }
                            .padding(12).card(Theme.card2, radius: 10)
                        }
                    }
                    .padding(14).card()
                }
                if !drafts.isEmpty {
                    Text("Names marked NEW will be added to your exercise library. Tap a name to change it.")
                        .font(.system(size: 12)).foregroundStyle(Theme.muted)
                }
            }
            .padding(16)
        }
    }

    private func setLabel(_ s: LoggedSet) -> String {
        s.weight == "BW" || s.weight.isEmpty ? "\(s.reps) BW" : "\(s.reps)×\(s.weight)"
    }

    // MARK: - Logic

    /// Names you've actually logged come first so matches use your own spelling.
    private var candidateNames: [String] {
        var seen = Set<String>()
        let used = store.data.workouts.flatMap { $0.exercises.map(\.name) }
        return (used + store.allExercises.map(\.name)).filter { seen.insert($0).inserted }
    }

    private var knownNames: Set<String> { Set(candidateNames) }

    private func review() {
        let names = candidateNames
        drafts = WorkoutTextParser.parse(text).map { w in
            let exercises = w.exercises.map { e -> DraftExercise in
                let match = WorkoutTextParser.bestMatch(for: e.rawName, among: names)
                return DraftExercise(name: match ?? titleCase(e.rawName), typed: e.rawName, isNew: match == nil, sets: e.sets)
            }
            return Draft(date: w.date, name: w.title ?? "", split: guessSplit(exercises.map(\.name)), exercises: exercises)
        }
        withAnimation { step = .review }
    }

    private func guessSplit(_ names: [String]) -> String {
        let splits = names.compactMap { ExerciseCatalog.find($0, custom: store.data.customExercises)?.split }
        let counts = Dictionary(splits.map { ($0, 1) }, uniquingKeysWith: +)
        return counts.max { $0.value < $1.value }?.key ?? "custom"
    }

    private func titleCase(_ s: String) -> String {
        s.split(separator: " ").map { w in
            ["ez", "db", "bb", "kb", "sa", "sl", "bw"].contains(w.lowercased()) ? w.uppercased() : w.prefix(1).uppercased() + w.dropFirst()
        }.joined(separator: " ")
    }

    private func save() {
        let workouts: [Workout] = drafts.compactMap { d in
            let exercises = d.exercises.filter { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty && !$0.sets.isEmpty }
            guard !exercises.isEmpty else { return nil }
            let n = d.name.trimmingCharacters(in: .whitespaces)
            var w = Workout(split: d.split, name: n.isEmpty ? (d.split == "custom" ? "Logged Workout" : nil) : n)
            w.date = DateFormatter.ymd.string(from: d.date)
            w.startTime = Calendar.current.date(bySettingHour: 12, minute: 0, second: 0, of: d.date) ?? d.date
            // Merge repeats of the same exercise.
            for e in exercises {
                let name = e.name.trimmingCharacters(in: .whitespaces)
                if let i = w.exercises.firstIndex(where: { $0.name == name }) { w.exercises[i].sets += e.sets }
                else { var ex = LoggedExercise(name: name); ex.sets = e.sets; w.exercises.append(ex) }
            }
            return w
        }
        let added = store.importWorkouts(workouts)
        if added == 0 && !workouts.isEmpty {
            message = "That workout is already in your history"
            withAnimation { step = .input }
            return
        }
        dismiss()
    }

    private func readPhoto(_ item: PhotosPickerItem) async {
        busy = true
        defer { busy = false; photo = nil }
        guard let data = try? await item.loadTransferable(type: Data.self), let image = UIImage(data: data)?.cgImage else {
            message = "Couldn't open that photo"; return
        }
        let lines: [String] = await Task.detached {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = false
            try? VNImageRequestHandler(cgImage: image).perform([request])
            let obs = (request.results ?? []).sorted { $0.boundingBox.midY > $1.boundingBox.midY }
            return obs.compactMap { $0.topCandidates(1).first?.string }
        }.value
        if lines.isEmpty { message = "No text found in that photo" } else { text = lines.joined(separator: "\n"); message = nil }
    }
}
