import SwiftUI

// MARK: - Custom workout (Build First / Build As You Go)

struct CustomWorkoutSheet: View {
    var onStart: (String?, [String]) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var buildFirst = false
    @State private var name = ""
    @State private var exercises: [String] = []
    @State private var showSelector = false

    var body: some View {
        NavigationStack {
            Group {
                if !buildFirst {
                    VStack(spacing: 16) {
                        VStack(spacing: 4) {
                            Text("Custom Workout").font(.title2.bold()).foregroundStyle(.white)
                            Text("How do you want to build it?").font(.subheadline).foregroundStyle(Theme.muted)
                        }
                        .padding(.bottom, 8)
                        Button { withAnimation { buildFirst = true } } label: {
                            choice("Build First", "Add all exercises, then start", primary: true)
                        }
                        Button { onStart(nil, []); dismiss() } label: {
                            choice("Build As You Go", "Start immediately, add exercises mid-session", primary: false)
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(24)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            SectionLabel(text: "Workout Name")
                            TextField("e.g. \"Pull Day\", \"Leg Blast\"", text: $name)
                                .padding(.horizontal, 16).padding(.vertical, 12)
                                .card(radius: 12)
                            SectionLabel(text: "Exercises (\(exercises.count))")
                            if !exercises.isEmpty {
                                VStack(spacing: 0) {
                                    ForEach(exercises, id: \.self) { ex in
                                        HStack {
                                            Text(ex).font(.subheadline).foregroundStyle(.white)
                                            Spacer()
                                            Button { exercises.removeAll { $0 == ex } } label: { Image(systemName: "xmark").foregroundStyle(Theme.muted) }
                                        }
                                        .padding(.horizontal, 16).padding(.vertical, 12)
                                        Divider().overlay(Theme.border)
                                    }
                                }
                                .card()
                            }
                            AddExerciseButton { showSelector = true }
                        }
                        .padding(16)
                    }
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Start") {
                                onStart(name.trimmingCharacters(in: .whitespaces), exercises)
                                dismiss()
                            }
                            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                        }
                    }
                }
            }
            .screenBackground()
            .navigationTitle(buildFirst ? "Custom Workout" : "")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { if buildFirst { withAnimation { buildFirst = false } } else { dismiss() } } label: { Image(systemName: "xmark") }
                }
            }
            .sheet(isPresented: $showSelector) {
                ExerciseSelector(currentExercises: exercises, split: nil) { exercises.append($0) }
            }
        }
        .presentationDetents(buildFirst ? [.large] : [.medium])
    }

    private func choice(_ title: String, _ sub: String, primary: Bool) -> some View {
        VStack(spacing: 4) {
            Text(title).font(.system(size: 16, weight: .bold))
            Text(sub).font(.system(size: 12)).opacity(primary ? 0.7 : 1).foregroundStyle(primary ? .black : Theme.muted)
        }
        .foregroundStyle(primary ? .black : .white)
        .frame(maxWidth: .infinity).padding(.vertical, 16)
        .background(primary ? Theme.green : Theme.raised, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(primary ? .clear : Theme.field))
    }
}

struct AddExerciseButton: View {
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            Label("Add Exercise", systemImage: "plus")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.green)
                .frame(maxWidth: .infinity).padding(.vertical, 16)
                .card()
                .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.border, style: StrokeStyle(lineWidth: 1, dash: [5, 4])))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Edit a finished workout

struct EditWorkoutSheet: View {
    @State var workout: Workout
    var onSave: (Workout) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var date = Date()
    @State private var durationMins = ""
    @State private var showSelector = false

    init(workout: Workout, onSave: @escaping (Workout) -> Void) {
        _workout = State(initialValue: workout)
        self.onSave = onSave
        _name = State(initialValue: workout.name ?? "")
        _date = State(initialValue: DateFormatter.ymd.date(from: workout.date) ?? workout.startTime)
        _durationMins = State(initialValue: workout.durationMinutes.map(String.init) ?? "")
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    SectionLabel(text: "Workout Name")
                    TextField("Push Day, Leg Blast…", text: $name)
                        .padding(.horizontal, 16).padding(.vertical, 12).card(radius: 12)

                    SectionLabel(text: "Date")
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                        .labelsHidden()
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .card(radius: 12)

                    SectionLabel(text: "Duration (minutes)")
                    TextField("e.g. 45", text: $durationMins)
                        .keyboardType(.numberPad)
                        .padding(.horizontal, 16).padding(.vertical, 12).card(radius: 12)

                    SectionLabel(text: "Workout Type")
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(ExerciseCatalog.splits + ["custom"], id: \.self) { key in
                            let on = workout.split == key
                            Button { workout.split = key } label: {
                                Text(ExerciseCatalog.splitLabel(key)).font(.system(size: 14, weight: .semibold))
                                    .frame(maxWidth: .infinity).padding(.vertical, 12)
                                    .foregroundStyle(on ? Theme.green : Theme.soft)
                                    .background(on ? Theme.green.opacity(0.13) : Theme.card, in: RoundedRectangle(cornerRadius: 12))
                                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(on ? Theme.green.opacity(0.27) : Theme.border))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    SectionLabel(text: "Exercises")
                    ForEach($workout.exercises) { $ex in
                        EditExerciseBlock(exercise: $ex) { workout.exercises.removeAll { $0.id == ex.id } }
                    }
                    AddExerciseButton { showSelector = true }
                }
                .padding(16)
            }
            .scrollDismissesKeyboard(.interactively)
            .screenBackground()
            .navigationTitle("Edit Workout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Image(systemName: "xmark") } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        var w = workout
                        let trimmed = name.trimmingCharacters(in: .whitespaces)
                        w.name = trimmed.isEmpty ? nil : trimmed
                        w.date = DateFormatter.ymd.string(from: date)
                        if let mins = Int(durationMins), mins > 0 { w.endTime = w.startTime.addingTimeInterval(TimeInterval(mins * 60)) }
                        onSave(w)
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
                ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Done") { hideKeyboard() } }
            }
            .sheet(isPresented: $showSelector) {
                ExerciseSelector(currentExercises: workout.exercises.map(\.name), split: workout.split) { name in
                    var ex = LoggedExercise(name: name)
                    ex.sets = [LoggedSet()]
                    workout.exercises.append(ex)
                }
            }
        }
    }
}

private struct EditExerciseBlock: View {
    @Binding var exercise: LoggedExercise
    var onRemove: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                TextField("Exercise", text: $exercise.name)
                    .font(.system(size: 14, weight: .semibold))
                Button(action: onRemove) { Image(systemName: "xmark").foregroundStyle(Theme.red) }
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            Divider().overlay(Theme.border)
            VStack(spacing: 6) {
                ForEach(Array($exercise.sets.enumerated()), id: \.element.id) { i, $set in
                    HStack(spacing: 8) {
                        Text("\(i + 1)").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.muted).frame(width: 20)
                        TextField("lbs", text: $set.weight).keyboardType(.decimalPad).fieldStyle()
                        TextField("reps", text: $set.reps).keyboardType(.numberPad).fieldStyle()
                        Button { exercise.sets.removeAll { $0.id == set.id } } label: {
                            Image(systemName: "trash").font(.system(size: 13)).foregroundStyle(Theme.muted)
                        }
                    }
                }
                Button {
                    let last = exercise.sets.last
                    exercise.sets.append(LoggedSet(weight: last?.weight ?? "", reps: last?.reps ?? ""))
                } label: {
                    Label("Add Set", systemImage: "plus").font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.green).frame(maxWidth: .infinity).padding(.vertical, 8)
                        .background(Theme.raised, in: RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                TextField("Session note…", text: $exercise.notes, axis: .vertical)
                    .lineLimit(2...5)
                    .font(.system(size: 14)).foregroundStyle(Color(hex: 0xAAAAAA))
                    .padding(10)
                    .background(Theme.card2, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.field))
                    .padding(.top, 4)
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
        }
        .card()
    }
}

// MARK: - Last 3 sessions for an exercise

struct LastSessionsSheet: View {
    var name: String
    var sessions: [ExerciseHistoryEntry]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    ForEach(Array(sessions.enumerated()), id: \.offset) { i, session in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 6) {
                                Text(i == 0 ? "Most Recent" : i == 1 ? "2 sessions ago" : "3 sessions ago")
                                    .font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.green)
                                Text("· \(session.date)").font(.system(size: 12)).foregroundStyle(Theme.muted)
                            }
                            HStack {
                                Text("SET").frame(width: 32, alignment: .leading)
                                Text("WEIGHT").frame(maxWidth: .infinity)
                                Text("REPS").frame(maxWidth: .infinity)
                            }
                            .font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.muted)
                            Divider().overlay(Theme.field)
                            ForEach(Array(session.sets.enumerated()), id: \.offset) { j, s in
                                HStack {
                                    Text("\(j + 1)").font(.system(size: 12, design: .monospaced)).foregroundStyle(Theme.muted).frame(width: 32, alignment: .leading)
                                    Text(s.weight.isEmpty ? "—" : (s.weight == "BW" ? "BW" : "\(s.weight) lbs")).frame(maxWidth: .infinity)
                                    Text(s.reps.isEmpty ? "—" : s.reps).frame(maxWidth: .infinity)
                                }
                                .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.text)
                            }
                            if !session.notes.isEmpty {
                                Text(session.notes).font(.system(size: 12)).foregroundStyle(Theme.soft).padding(.top, 2)
                            }
                        }
                    }
                }
                .padding(20)
            }
            .screenBackground()
            .navigationTitle(name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Image(systemName: "xmark") } } }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Session note history

struct NotesHistorySheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    var name: String

    var body: some View {
        NavigationStack {
            let notes = store.sessionNotes(for: name)
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    let setup = store.setupNote(for: name)
                    if !setup.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Label("SETUP", systemImage: "wrench.adjustable").font(.system(size: 10, weight: .bold)).tracking(1.2).foregroundStyle(Theme.gold)
                            Text(setup).font(.system(size: 14)).foregroundStyle(Theme.gold.opacity(0.9))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12).card(Theme.card2, radius: 12)
                    }
                    if notes.isEmpty {
                        EmptyState(icon: "note.text", text: "No session notes yet")
                    }
                    ForEach(notes) { n in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(n.date).font(.system(size: 12, weight: .bold)).foregroundStyle(n.isCurrent ? Theme.green : Theme.soft)
                                Text("· \(n.workoutTitle)").font(.system(size: 12)).foregroundStyle(Theme.muted)
                            }
                            Text(n.text).font(.system(size: 14)).foregroundStyle(Theme.text)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12).card(radius: 12)
                    }
                }
                .padding(16)
            }
            .screenBackground()
            .navigationTitle("\(name) notes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Image(systemName: "xmark") } } }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Exercise image thumbnails (wger.de lookup, same as the web)

@MainActor
final class WgerImages {
    static let shared = WgerImages()
    private var cache: [String: URL?] = [:]
    private var inflight: [String: Task<URL?, Never>] = [:]

    func url(for name: String) async -> URL? {
        if let hit = cache[name] { return hit }
        if let task = inflight[name] { return await task.value }
        let task = Task<URL?, Never> {
            let term = name.split(separator: " ").prefix(3).joined(separator: " ")
            var comps = URLComponents(string: "https://wger.de/api/v2/exercise/search/")!
            comps.queryItems = [.init(name: "term", value: term), .init(name: "language", value: "english"), .init(name: "format", value: "json")]
            struct Search: Decodable { struct S: Decodable { struct D: Decodable { let id: Int? }; let data: D? }; let suggestions: [S]? }
            struct Images: Decodable { struct R: Decodable { let image: String? }; let results: [R]? }
            guard let url = comps.url,
                  let (raw, _) = try? await URLSession.shared.data(from: url),
                  let id = (try? JSONDecoder().decode(Search.self, from: raw))?.suggestions?.first?.data?.id,
                  let imgURL = URL(string: "https://wger.de/api/v2/exerciseimage/?exercise_base=\(id)&format=json"),
                  let (raw2, _) = try? await URLSession.shared.data(from: imgURL),
                  let img = (try? JSONDecoder().decode(Images.self, from: raw2))?.results?.first?.image
            else { return nil }
            return URL(string: img)
        }
        inflight[name] = task
        let result = await task.value
        cache[name] = result
        inflight[name] = nil
        return result
    }
}

struct ExerciseThumb: View {
    var name: String
    var size: CGFloat = 36
    @State private var url: URL?

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8).fill(Theme.field)
            if let url {
                AsyncImage(url: url) { img in img.resizable().scaledToFill() } placeholder: { Color.clear }
            } else {
                Image(systemName: "dumbbell.fill").font(.system(size: size * 0.35)).foregroundStyle(Theme.muted)
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .task(id: name) { url = await WgerImages.shared.url(for: name) }
    }
}
