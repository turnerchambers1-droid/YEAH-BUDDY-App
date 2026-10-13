import SwiftUI

/// Port of LibraryView.jsx — every exercise grouped by primary muscle, with detail + create.
struct LibraryView: View {
    @Environment(Store.self) private var store
    @State private var search = ""
    @State private var showNew = false
    @State private var selected: ExerciseDef?

    static let groupOrder = ["chest", "lats", "mid_back", "lower_back", "traps", "front_delt", "side_delt", "rear_delt",
                             "biceps", "triceps", "forearms", "quads", "hamstrings", "glutes", "calves", "abs", "adductors", "abductors"]

    var body: some View {
        let filtered = store.allExercises.filter { ExerciseCatalog.matchesSearch($0, search) }
        let grouped = Dictionary(grouping: filtered) { $0.primaryMuscles.first ?? "abs" }
        let order = Self.groupOrder.filter { grouped[$0] != nil } + grouped.keys.filter { !Self.groupOrder.contains($0) }.sorted()

        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8, pinnedViews: []) {
                    ForEach(order, id: \.self) { muscle in
                        SectionLabel(text: ExerciseCatalog.muscleLabel(muscle), color: Theme.green).padding(.top, 12)
                        VStack(spacing: 0) {
                            let items = grouped[muscle] ?? []
                            ForEach(Array(items.enumerated()), id: \.element.name) { i, ex in
                                Button { selected = ex } label: { row(ex) }.buttonStyle(.plain)
                                if i < items.count - 1 { Divider().overlay(Theme.border) }
                            }
                        }
                        .card()
                    }
                }
                .padding(.horizontal, 16).padding(.bottom, 24)
            }
            .screenBackground()
            .navigationTitle("Exercises")
            .searchable(text: $search, prompt: "Search by name or muscle...")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showNew = true } label: { Image(systemName: "plus") }
                }
            }
            .sheet(isPresented: $showNew) { NewExerciseSheet() }
            .sheet(item: $selected) { ExerciseDetailSheet(exercise: $0) }
        }
    }

    private func row(_ ex: ExerciseDef) -> some View {
        let pr = store.personalRecord(for: ex.name)
        return HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(ex.name).font(.system(size: 14, weight: .medium)).foregroundStyle(.white).lineLimit(1)
                    if let e = store.equipmentTag(for: ex.name) { Tag(text: e, color: Theme.equipColor(e)) }
                }
                FlowRow(spacing: 4) {
                    ForEach(ex.primaryMuscles, id: \.self) { muscleChip($0, Theme.green, 0.13) }
                    ForEach(ex.secondaryMuscles.prefix(2), id: \.self) { muscleChip($0, Theme.teal, 0.07) }
                }
            }
            Spacer()
            if pr > 0 { Text("\(Fmt.number(pr))lbs").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.green) }
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Color(hex: 0x374151))
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .contentShape(Rectangle())
    }

    private func muscleChip(_ m: String, _ c: Color, _ o: Double) -> some View {
        Text(ExerciseCatalog.muscleLabel(m)).font(.system(size: 11))
            .padding(.horizontal, 6).padding(.vertical, 2)
            .foregroundStyle(c).background(c.opacity(o), in: Capsule())
    }
}

struct ExerciseDetailSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    var exercise: ExerciseDef
    @State private var imageURL: URL?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let imageURL {
                        AsyncImage(url: imageURL) { $0.resizable().scaledToFit() } placeholder: { Color.clear }
                            .frame(maxHeight: 190).frame(maxWidth: .infinity).card()
                    }
                    VStack(spacing: 12) {
                        MuscleBodyMap(primary: exercise.primaryMuscles, secondary: exercise.secondaryMuscles)
                        HStack(spacing: 16) {
                            legend(Theme.green, exercise.primaryMuscles.map(ExerciseCatalog.muscleLabel).joined(separator: ", "))
                            if !exercise.secondaryMuscles.isEmpty {
                                legend(Theme.teal, exercise.secondaryMuscles.map(ExerciseCatalog.muscleLabel).joined(separator: ", "))
                            }
                        }
                    }
                    .padding(16).card()

                    let pr = store.personalRecord(for: exercise.name)
                    if pr > 0 {
                        HStack(spacing: 12) {
                            Text("🏆").font(.title)
                            VStack(alignment: .leading) {
                                SectionLabel(text: "Personal Record", color: Theme.green)
                                Text("\(Fmt.number(pr)) lbs").font(.title2.bold()).foregroundStyle(.white)
                            }
                        }
                        .padding(16).frame(maxWidth: .infinity, alignment: .leading).card()
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Label("EQUIPMENT", systemImage: "dumbbell").font(.system(size: 10, weight: .bold)).tracking(1.2).foregroundStyle(Theme.soft)
                            Spacer()
                            Text("Used in future workouts").font(.system(size: 10)).foregroundStyle(Theme.dim)
                        }
                        EquipmentPicker(selected: store.equipmentChoice(for: exercise.name)
                                        ?? ExerciseCatalog.equipmentOption(forTag: store.equipmentTag(for: exercise.name))) {
                            store.setEquipment(exercise.name, $0)
                        }
                    }
                    .padding(16).frame(maxWidth: .infinity, alignment: .leading).card()

                    let setup = store.setupNote(for: exercise.name)
                    VStack(alignment: .leading, spacing: 6) {
                        Label("SETUP NOTE", systemImage: "wrench.adjustable").font(.system(size: 10, weight: .bold)).tracking(1.2).foregroundStyle(Theme.gold)
                        TextField("Seat 3, handle low slot, pin 4th from top…", text: Binding(
                            get: { setup }, set: { store.setSetupNote($0, for: exercise.name) }
                        ), axis: .vertical)
                        .lineLimit(1...5)
                        .foregroundStyle(Theme.gold.opacity(0.9))
                    }
                    .padding(16).card()
                }
                .padding(16)
            }
            .screenBackground()
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Image(systemName: "xmark") } } }
            .task { imageURL = await WgerImages.shared.url(for: exercise.name) }
        }
    }

    private func legend(_ c: Color, _ text: String) -> some View {
        HStack(spacing: 6) {
            Circle().fill(c).frame(width: 10, height: 10)
            Text(text).font(.system(size: 12)).foregroundStyle(Theme.soft)
        }
    }
}

struct NewExerciseSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var primary: [String] = []
    @State private var secondary: [String] = []
    @State private var suggested = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    SectionLabel(text: "Exercise Name")
                    TextField("e.g. Cable Crossover", text: $name)
                        .padding(.horizontal, 16).padding(.vertical, 12)
                        .background(Theme.raised, in: RoundedRectangle(cornerRadius: 12))
                        .onChange(of: name) { suggested = false }

                    if name.trimmingCharacters(in: .whitespaces).count > 2 && !suggested {
                        Button {
                            let s = Self.suggestMuscles(name)
                            primary = s.primary; secondary = s.secondary; suggested = true
                        } label: {
                            Label("Suggest muscles for \"\(name)\"", systemImage: "sparkles")
                                .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.green)
                                .frame(maxWidth: .infinity).padding(.vertical, 12)
                                .background(Theme.green.opacity(0.13), in: RoundedRectangle(cornerRadius: 12))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.green.opacity(0.27)))
                        }
                        .buttonStyle(.plain)
                    }

                    if !primary.isEmpty || !secondary.isEmpty {
                        MuscleBodyMap(primary: primary, secondary: secondary, compact: true).padding(16).card()
                    }

                    SectionLabel(text: "Muscle Activation")
                    VStack(spacing: 4) {
                        ForEach(ExerciseCatalog.muscleLabels, id: \.id) { m in
                            HStack {
                                Text(m.label).font(.subheadline).foregroundStyle(.white)
                                Spacer()
                                Pill(text: "Primary", selected: primary.contains(m.id)) {
                                    if primary.contains(m.id) { primary.removeAll { $0 == m.id } } else { primary.append(m.id) }
                                    secondary.removeAll { $0 == m.id }
                                }
                                Pill(text: "Secondary", selected: secondary.contains(m.id), color: Theme.teal) {
                                    if secondary.contains(m.id) { secondary.removeAll { $0 == m.id } } else { secondary.append(m.id) }
                                    primary.removeAll { $0 == m.id }
                                }
                            }
                            .padding(.horizontal, 16).padding(.vertical, 10)
                            .card(radius: 12)
                        }
                    }
                }
                .padding(16)
            }
            .screenBackground()
            .navigationTitle("New Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Image(systemName: "xmark") } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        let trimmed = name.trimmingCharacters(in: .whitespaces)
                        store.addCustomExercise(ExerciseDef(name: trimmed, split: "ChestBi",
                                                            muscleGroup: primary.first.map(Self.pickerGroup) ?? "Chest",
                                                            primaryMuscles: primary, secondaryMuscles: secondary))
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    /// Map a muscle id to the exercise picker's group tabs so new exercises show up there.
    static func pickerGroup(_ m: String) -> String {
        switch m {
        case "chest": return "Chest"
        case "lats", "mid_back", "lower_back": return "Back"
        case "front_delt", "side_delt": return "Shoulder"
        case "rear_delt": return "Rear Delt"
        case "biceps": return "Bicep"
        case "triceps": return "Tricep"
        case "forearms": return "Forearm"
        case "traps": return "Trap"
        case "quads": return "Quad"
        case "hamstrings": return "Hamstring"
        case "glutes", "adductors", "abductors": return "Glute"
        case "calves": return "Calf"
        default: return "Abs"
        }
    }

    /// Keyword-based muscle guess (port of suggestMuscles).
    static func suggestMuscles(_ raw: String) -> (primary: [String], secondary: [String]) {
        let n = raw.lowercased()
        func has(_ pattern: String) -> Bool { n.range(of: pattern, options: .regularExpression) != nil }
        var p: [String] = [], s: [String] = []
        if has("bench|chest|fly|pec|press") && !has("shoulder|overhead|military") { p.append("chest"); s += ["front_delt", "triceps"] }
        if has("curl|bicep|preacher|hammer curl") && !has("leg curl|tricep") { p.append("biceps"); s.append("forearms") }
        if has("skull|pushdown|extension|dip|tricep|kickback|close grip") { p.append("triceps"); if has("dip|close grip") { s += ["chest", "front_delt"] } }
        if has("pull up|chin up|pull-up|lat|pulldown|row") && !has("upright row") { p.append("lats"); s += ["biceps", "mid_back"] }
        if has("row") && !has("upright row") && !p.contains("mid_back") { p.append("mid_back"); s += ["lats", "biceps"] }
        if has("shrug|trap") { p.append("traps") }
        if has("shoulder press|overhead press|military|arnold|front raise|lateral raise|lat raise") {
            if has("front raise") { p.append("front_delt") }
            else if has("lat raise|lateral") { p.append("side_delt"); s.append("traps") }
            else { p.append("side_delt"); s += ["front_delt", "triceps"] }
        }
        if has("rear delt|face pull|reverse fly") { p.append("rear_delt"); s += ["mid_back", "traps"] }
        if has("squat|leg press|lunge|hack squat|belt squat") { p.append("quads"); s += ["glutes", "hamstrings"] }
        if has("deadlift|rdl|stiff|leg curl|hamstring") { p.append("hamstrings"); s += ["glutes", "lower_back"] }
        if has("glute|hip thrust|back extension") { p.append("glutes"); s.append("hamstrings") }
        if has("calf|raise") && !has("shoulder raise|lat raise|front raise") { p.append("calves") }
        if has("crunch|situp|sit-up|ab |abs|leg raise") { p.append("abs") }
        if has("wrist|forearm") { p.append("forearms") }
        var seen = Set<String>()
        let up = p.filter { seen.insert($0).inserted }
        var seen2 = Set<String>()
        let us = s.filter { !up.contains($0) && seen2.insert($0).inserted }
        return (up, us)
    }
}
