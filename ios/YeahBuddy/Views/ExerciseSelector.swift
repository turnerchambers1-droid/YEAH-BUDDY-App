import SwiftUI

/// Port of ExerciseSelector.jsx: search, multi-select muscle groups preset by split,
/// equipment filter, fuzzy "did you mean", and inline create.
struct ExerciseSelector: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    var currentExercises: [String]
    var split: String?
    var onSelect: (String) -> Void

    @State private var search = ""
    @State private var activeGroups: Set<String> = []
    @State private var activeEquip: String?
    @State private var showCreate = false
    @State private var showAllGroups = false

    static let muscleGroups = ["Chest", "Back", "Shoulder", "Bicep", "Tricep", "Quad", "Hamstring", "Glute", "Abs", "Calf", "Forearm", "Rear Delt", "Trap", "Kettlebell"]
    /// Muscle groups for this workout's split; other groups hide behind "+ More".
    private var splitGroups: [String] { split.flatMap { ExerciseCatalog.splitMuscleGroups[$0] } ?? [] }
    private var visibleGroups: [String] {
        if splitGroups.isEmpty || showAllGroups { return Self.muscleGroups }
        return Self.muscleGroups.filter { splitGroups.contains($0) || activeGroups.contains($0) }
    }

    var body: some View {
        let all = store.allExercises
        let pool = (search.isEmpty ? all.filter { activeGroups.contains($0.muscleGroup) } : all)
            .filter { ExerciseCatalog.matchesSearch($0, search) }
        let tags = Dictionary(pool.map { ($0.name, store.equipmentTag(for: $0.name) ?? "") }, uniquingKeysWith: { a, _ in a })
        let equipTypes = ExerciseCatalog.equipmentTagOrder.filter { t in tags.values.contains(t) }
        let filtered = activeEquip.map { e in pool.filter { tags[$0.name] == e } } ?? pool
        let groups = Dictionary(grouping: filtered, by: \.muscleGroup)
        let groupOrder = filtered.map(\.muscleGroup).reduce(into: [String]()) { if !$0.contains($1) { $0.append($1) } }
        let showThumbs = !search.isEmpty && !filtered.isEmpty && filtered.count <= 20

        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if search.isEmpty {
                        FlowRow(spacing: 8) {
                            ForEach(visibleGroups, id: \.self) { g in
                                let on = activeGroups.contains(g)
                                Button {
                                    if on { activeGroups.remove(g) } else { activeGroups.insert(g) }
                                    activeEquip = nil
                                } label: {
                                    Text(g).font(.system(size: 14, weight: .semibold))
                                        .padding(.horizontal, 16).padding(.vertical, 8)
                                        .foregroundStyle(on ? .black : Theme.soft)
                                        .background(on ? Theme.green : Theme.raised, in: Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                            if !splitGroups.isEmpty {
                                Button { withAnimation(.snappy) { showAllGroups.toggle() } } label: {
                                    Label(showAllGroups ? "Less" : "More", systemImage: showAllGroups ? "minus" : "plus")
                                        .font(.system(size: 14, weight: .semibold))
                                        .padding(.horizontal, 14).padding(.vertical, 8)
                                        .foregroundStyle(Theme.soft)
                                        .overlay(Capsule().strokeBorder(Theme.field, style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    if !equipTypes.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                if activeEquip != nil {
                                    Button { activeEquip = nil } label: {
                                        Label("All", systemImage: "xmark").font(.system(size: 12, weight: .bold))
                                            .padding(.horizontal, 12).padding(.vertical, 6)
                                            .foregroundStyle(Theme.soft).background(Theme.raised, in: Capsule())
                                    }
                                    .buttonStyle(.plain)
                                }
                                ForEach(equipTypes, id: \.self) { e in
                                    let on = activeEquip == e
                                    let c = Theme.equipColor(e)
                                    Button { activeEquip = on ? nil : e } label: {
                                        Text(e).font(.system(size: 12, weight: .bold))
                                            .padding(.horizontal, 12).padding(.vertical, 6)
                                            .foregroundStyle(on ? c : Color(hex: 0x666666))
                                            .background(on ? c.opacity(0.13) : Theme.raised, in: Capsule())
                                            .overlay(Capsule().stroke(on ? c.opacity(0.33) : Theme.field))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    if showCreate {
                        CreateExerciseForm(initialName: search) { ex in
                            store.addCustomExercise(ex)
                            onSelect(ex.name)
                            dismiss()
                        } onCancel: { showCreate = false }
                    }

                    if !search.isEmpty && filtered.isEmpty {
                        let fuzzy = fuzzySuggestions(all)
                        if !fuzzy.isEmpty {
                            SectionLabel(text: "Did you mean…")
                            list(fuzzy, thumbs: false)
                        }
                        if !showCreate {
                            VStack(spacing: 12) {
                                Image(systemName: "magnifyingglass").font(.system(size: 30)).foregroundStyle(Theme.dim)
                                Text("No exercises found for \"\(search)\"").font(.subheadline).foregroundStyle(Theme.muted)
                                Button { showCreate = true } label: {
                                    Label("Create \"\(search)\"", systemImage: "plus")
                                        .font(.system(size: 14, weight: .semibold))
                                        .padding(.horizontal, 20).padding(.vertical, 12)
                                        .foregroundStyle(Theme.green)
                                        .background(Theme.green.opacity(0.13), in: RoundedRectangle(cornerRadius: 16))
                                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.green.opacity(0.27)))
                                }
                                .buttonStyle(.plain)
                            }
                            .frame(maxWidth: .infinity).padding(.vertical, 24)
                        }
                    }

                    if search.isEmpty && activeGroups.isEmpty {
                        EmptyState(icon: "hand.tap", text: "Select a muscle group above")
                    }
                    if activeEquip != nil && filtered.isEmpty && !activeGroups.isEmpty {
                        EmptyState(icon: "line.3.horizontal.decrease", text: "No \(activeEquip!) exercises in this group")
                    }

                    ForEach(groupOrder, id: \.self) { g in
                        SectionLabel(text: g, color: Theme.green).padding(.top, 4)
                        list(groups[g] ?? [], thumbs: showThumbs)
                    }

                    if !search.isEmpty && !filtered.isEmpty && !showCreate {
                        Button { showCreate = true } label: {
                            Label("Create New Exercise", systemImage: "plus")
                                .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.green)
                                .frame(maxWidth: .infinity).padding(.vertical, 16).card()
                                .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.green.opacity(0.27), style: StrokeStyle(lineWidth: 1, dash: [5, 4])))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16).padding(.bottom, 24)
            }
            .scrollDismissesKeyboard(.interactively)
            .screenBackground()
            .navigationTitle("Add Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $search, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search exercises...")
            .onChange(of: search) { activeEquip = nil }
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Image(systemName: "xmark") } } }
        }
        .onAppear {
            let preset = split.flatMap { ExerciseCatalog.splitMuscleGroups[$0] } ?? []
            activeGroups = Set(preset.isEmpty ? ["Chest"] : preset)
        }
    }

    private func list(_ items: [ExerciseDef], thumbs: Bool) -> some View {
        VStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.element.name) { i, ex in
                let added = currentExercises.contains(ex.name)
                Button {
                    guard !added else { return }
                    onSelect(ex.name)
                    dismiss()
                } label: {
                    HStack(spacing: 12) {
                        if thumbs { ExerciseThumb(name: ex.name, size: 40) }
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(ex.name).font(.system(size: 14, weight: .medium)).foregroundStyle(.white).lineLimit(1)
                                if let e = store.equipmentTag(for: ex.name) { Tag(text: e, color: Theme.equipColor(e)) }
                            }
                            Text(ex.primaryMuscles.map { $0.replacingOccurrences(of: "_", with: " ") }.joined(separator: ", "))
                                .font(.system(size: 12)).foregroundStyle(Theme.muted)
                        }
                        Spacer()
                        if added {
                            Text("Added").font(.system(size: 12)).foregroundStyle(Theme.green)
                        } else {
                            Image(systemName: "plus").foregroundStyle(Theme.dim)
                        }
                    }
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .contentShape(Rectangle())
                    .opacity(added ? 0.4 : 1)
                }
                .buttonStyle(.plain)
                if i < items.count - 1 { Divider().overlay(Theme.border) }
            }
        }
        .card()
    }

    private func fuzzySuggestions(_ all: [ExerciseDef]) -> [ExerciseDef] {
        let q = search.lowercased()
        func score(_ name: String) -> Double {
            let a = name.lowercased()
            if a == q { return 0 }
            if a.contains(q) || q.contains(a) { return 1 }
            let aw = a.split(separator: " "), bw = q.split(separator: " ")
            let overlap = aw.filter { w in bw.contains { $0.contains(w) || w.contains($0) } }.count
            if overlap > 0 { return 2 - Double(overlap) * 0.1 }
            let matches = zip(a, q).filter { $0 == $1 }.count
            return 3 - Double(matches) / Double(max(a.count, q.count))
        }
        return all.map { ($0, score($0.name)) }.filter { $0.1 < 2.5 }.sorted { $0.1 < $1.1 }.prefix(5).map(\.0)
    }
}

struct CreateExerciseForm: View {
    var initialName: String
    var onAdd: (ExerciseDef) -> Void
    var onCancel: () -> Void
    @State private var name = ""
    @State private var primary = ""
    @State private var equipment = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Create New Exercise").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.green)
                Spacer()
                Button(action: onCancel) { Image(systemName: "xmark").foregroundStyle(Theme.muted) }
            }
            TextField("Exercise name", text: $name)
                .padding(.horizontal, 12).padding(.vertical, 10)
                .background(Theme.field, in: RoundedRectangle(cornerRadius: 12))
            Text("Primary Muscle").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.muted)
            FlowRow(spacing: 6) {
                ForEach(ExerciseCatalog.muscleLabels.prefix(16), id: \.id) { m in
                    Pill(text: m.label, selected: primary == m.id) { primary = m.id }
                }
            }
            Text("Equipment").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.muted)
            FlowRow(spacing: 6) {
                ForEach(ExerciseCatalog.equipmentOptions, id: \.self) { e in
                    Pill(text: e, selected: equipment == e) { equipment = e }
                }
            }
            let ready = !name.trimmingCharacters(in: .whitespaces).isEmpty && !primary.isEmpty
            Button {
                onAdd(ExerciseDef(name: name.trimmingCharacters(in: .whitespaces), split: inferSplit(primary),
                                  muscleGroup: ExerciseCatalog.muscleLabel(primary), primaryMuscles: [primary],
                                  secondaryMuscles: [], equipment: equipment.isEmpty ? "Other" : equipment, custom: true))
            } label: {
                Text("Add Exercise").font(.system(size: 14, weight: .bold))
                    .frame(maxWidth: .infinity).padding(.vertical, 12)
                    .foregroundStyle(ready ? .black : Theme.muted)
                    .background(ready ? Theme.green : Theme.field, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .disabled(!ready)
        }
        .padding(16)
        .card(Theme.card2)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.green.opacity(0.2)))
        .onAppear { name = initialName }
    }

    private func inferSplit(_ m: String) -> String {
        if ["chest", "biceps", "forearms"].contains(m) { return "ChestBi" }
        if ["lats", "mid_back", "lower_back", "triceps", "traps"].contains(m) { return "BackTri" }
        if ["front_delt", "side_delt", "rear_delt", "abs", "abductors", "adductors"].contains(m) { return "Shoulders" }
        return "LegsAbs"
    }
}
