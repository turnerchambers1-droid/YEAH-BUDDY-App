import SwiftUI

/// Port of ExerciseCard + SetRow from WorkoutLogger.jsx, plus the two new note types.
struct ExerciseCard: View {
    @Environment(Store.self) private var store
    var exercise: LoggedExercise
    var workoutSplit: String
    var isCurrent: Bool
    var expanded: Bool
    var onToggleExpand: () -> Void

    @State private var confirmRemove = false
    @State private var editingName = false
    @State private var nameInput = ""
    @State private var editingEquip = false
    @State private var editingGoal = false
    @State private var showLastSessions = false
    @State private var showNotesHistory = false
    @State private var editingSetup = false
    @FocusState private var nameFocused: Bool

    private var name: String { exercise.name }

    var body: some View {
        let history = store.history(for: name)
        let pr = history.map(\.maxWeight).max() ?? 0
        let currentEquip = store.equipmentTag(for: name)
        let maxWeight = exercise.sets.map(\.weightValue).max() ?? 0
        let isBWPR = exercise.sets.contains { $0.weight == "BW" } && !history.contains { $0.hasBW }
        let isPR = (maxWeight > 0 && maxWeight > pr) || isBWPR
        let lastSessions = Array(history.suffix(3).reversed())
        let lastSession = lastSessions.first
        let lastSet = lastSession?.sets.last
        let showPrevMoveUp = (lastSession?.readyToMoveUp ?? false) && !exercise.readyToMoveUp
        let setupNote = store.setupNote(for: name)
        let previousNote = store.latestPreviousNote(for: name)

        VStack(alignment: .leading, spacing: 0) {
            headerRow(currentEquip: currentEquip, isPR: isPR, showPrevMoveUp: showPrevMoveUp)

            if editingEquip { equipmentEditor }
            if editingGoal { goalEditor(history: history) }

            VStack(alignment: .leading, spacing: 6) {
                // Setup note — permanent, always visible.
                if !setupNote.isEmpty && !(expanded && editingSetup) {
                    Button { if expanded { editingSetup = true } else { onToggleExpand(); editingSetup = true } } label: {
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "wrench.adjustable").font(.system(size: 11)).foregroundStyle(Theme.gold)
                                .padding(.top, 2)
                            Text(setupNote).font(.system(size: 12)).foregroundStyle(Theme.gold.opacity(0.9))
                                .multilineTextAlignment(.leading)
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 10).padding(.vertical, 6)
                        .card(Theme.card2, radius: 8)
                    }
                    .buttonStyle(.plain)
                }

                if !exercise.goalWeight.isEmpty || !exercise.goalReps.isEmpty {
                    HStack(spacing: 6) {
                        Image(systemName: "target").font(.system(size: 11)).foregroundStyle(Theme.gold)
                        Text("Goal:").foregroundStyle(Theme.muted)
                        Text(goalText(exercise)).fontWeight(.semibold).foregroundStyle(Theme.gold)
                        if let top = exercise.topSet {
                            (Text("· Now: ").foregroundStyle(Theme.muted)
                             + Text("\(top.weight == "BW" ? "BW" : "\(top.weight.isEmpty ? "—" : top.weight) lbs") × \(top.reps.isEmpty ? "—" : top.reps)").fontWeight(.semibold).foregroundStyle(Theme.text))
                        }
                    }
                    .font(.system(size: 12))
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .card(Theme.card2, radius: 8)
                }

                if let lastSet, lastSet.weight == "BW" || lastSet.weightValue > 0 {
                    Button { showLastSessions = true } label: {
                        HStack(spacing: 6) {
                            Text("Last:").foregroundStyle(Theme.muted)
                            Text("\(Fmt.weight(lastSet.weight)) × \(lastSet.repsValue)")
                                .fontWeight(.semibold).foregroundStyle(Theme.green).underline(pattern: .dot)
                            Text("— tap for last \(lastSessions.count)").foregroundStyle(Theme.dim)
                        }
                        .font(.system(size: 12))
                        .padding(.horizontal, 10).padding(.vertical, 5)
                        .card(Theme.card2, radius: 8)
                    }
                    .buttonStyle(.plain)
                }

                if exercise.readyToMoveUp {
                    banner("Ready to increase weight next session")
                }
                if showPrevMoveUp {
                    banner("You flagged this to increase weight last session — try going up")
                }

                // Session note stays visible (collapsed) until a newer one replaces it.
                if !expanded {
                    let shown = exercise.notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? previousNote?.text : exercise.notes
                    if let shown, !shown.isEmpty {
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "note.text").font(.system(size: 11)).foregroundStyle(Theme.soft).padding(.top, 2)
                            Text(shown).font(.system(size: 12)).foregroundStyle(Theme.soft).lineLimit(2)
                        }
                        .padding(.horizontal, 2)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, expanded ? 4 : 12)

            if expanded {
                expandedBody(history: history, setupNote: setupNote, previousNote: previousNote)
            }
        }
        .card()
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(isCurrent ? Theme.green.opacity(0.25) : .clear, lineWidth: 1)
        )
        .sheet(isPresented: $showLastSessions) {
            LastSessionsSheet(name: name, sessions: lastSessions)
        }
        .sheet(isPresented: $showNotesHistory) {
            NotesHistorySheet(name: name)
        }
    }

    // MARK: Header

    @ViewBuilder private func headerRow(currentEquip: String?, isPR: Bool, showPrevMoveUp: Bool) -> some View {
        HStack(spacing: 4) {
            if editingName {
                TextField("Exercise name", text: $nameInput)
                    .font(.system(size: 15, weight: .bold))
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Theme.raised, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.green.opacity(0.27)))
                    .focused($nameFocused)
                    .submitLabel(.done)
                    .onSubmit(commitRename)
                Button("Done", action: commitRename)
                    .font(.system(size: 12, weight: .bold))
                    .padding(.horizontal, 12).padding(.vertical, 5)
                    .foregroundStyle(Theme.green)
                    .background(Theme.green.opacity(0.13), in: RoundedRectangle(cornerRadius: 8))
            } else {
                Button(action: onToggleExpand) {
                    FlowRow(spacing: 6) {
                        ExerciseNameLabel(name: name, currentEquip: currentEquip)
                        if let currentEquip { Tag(text: currentEquip, color: Theme.equipColor(currentEquip)) }
                        if isPR { Tag(text: "PR!", color: Theme.green) }
                        if showPrevMoveUp {
                            Label("Up weight", systemImage: "arrow.up.circle").font(.system(size: 11, weight: .bold))
                                .foregroundStyle(Theme.cyan)
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(Theme.cyan.opacity(0.13), in: Capsule())
                        }
                        if !exercise.sets.isEmpty {
                            Text("\(exercise.sets.count) set\(exercise.sets.count > 1 ? "s" : "")")
                                .font(.system(size: 12)).foregroundStyle(Theme.muted)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                iconButton("pencil", active: false) { nameInput = name; editingName = true; nameFocused = true }
                iconButton("dumbbell", active: editingEquip) { withAnimation(.snappy) { editingEquip.toggle() } }
                iconButton("target", active: editingGoal, idle: (!exercise.goalWeight.isEmpty || !exercise.goalReps.isEmpty) ? Theme.gold : Theme.dim) {
                    withAnimation(.snappy) { editingGoal.toggle() }
                }
                iconButton("arrow.up.circle", active: exercise.readyToMoveUp, activeColor: Theme.cyan, size: 17) {
                    store.toggleReadyToMoveUp(name)
                }
                Button {
                    if confirmRemove {
                        withAnimation { store.removeExercise(name) }
                    } else {
                        confirmRemove = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { confirmRemove = false }
                    }
                } label: {
                    Group {
                        if confirmRemove {
                            Text("remove?").font(.system(size: 11, weight: .bold))
                        } else {
                            Image(systemName: "xmark").font(.system(size: 15, weight: .semibold))
                        }
                    }
                    .foregroundStyle(confirmRemove ? Theme.red : Theme.dim)
                    .padding(8)
                    .background(confirmRemove ? Theme.red.opacity(0.1) : .clear, in: RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
                Button(action: onToggleExpand) {
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.dim)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private func iconButton(_ icon: String, active: Bool, activeColor: Color = Theme.green, idle: Color = Theme.dim, size: CGFloat = 13, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: size, weight: .semibold))
                .foregroundStyle(active ? activeColor : idle)
                .frame(width: 28, height: 28)
                .background(active ? activeColor.opacity(0.13) : .clear, in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    private func commitRename() {
        store.renameExercise(name, to: nameInput)
        editingName = false
    }

    private func banner(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "arrow.up.circle").font(.system(size: 13))
            Text(text).font(.system(size: 12, weight: .semibold))
            Spacer(minLength: 0)
        }
        .foregroundStyle(Theme.cyan)
        .padding(.horizontal, 10).padding(.vertical, 6)
        .background(Theme.cyan.opacity(0.07), in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.cyan.opacity(0.2)))
    }

    // MARK: Editors

    private var equipmentEditor: some View {
        let chosen = store.equipmentChoice(for: name)
        return VStack(alignment: .leading, spacing: 6) {
            Text("Equipment — saved for future workouts").font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.muted)
            EquipmentPicker(selected: chosen ?? ExerciseCatalog.equipmentOption(forTag: store.equipmentTag(for: name))) { opt in
                store.setEquipment(name, opt)
                withAnimation(.snappy) { editingEquip = false }
            }
        }
        .padding(10)
        .card(Theme.card2, radius: 12)
        .padding(.horizontal, 16).padding(.bottom, 8)
    }

    private func goalEditor(history: [ExerciseHistoryEntry]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                ForEach(["8", "15"], id: \.self) { r in
                    let on = exercise.goalReps == r
                    Button {
                        if on {
                            store.updateGoal(name, weight: "", reps: "")
                        } else {
                            store.updateGoal(name, weight: bestWeight(for: r, in: history) ?? exercise.goalWeight, reps: r)
                        }
                    } label: {
                        Text("\(r) reps").font(.system(size: 14, weight: .bold))
                            .frame(maxWidth: .infinity).padding(.vertical, 8)
                            .foregroundStyle(on ? Theme.green : Theme.soft)
                            .background(on ? Theme.green.opacity(0.13) : Theme.field, in: RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(on ? Theme.green.opacity(0.27) : .clear))
                    }
                    .buttonStyle(.plain)
                }
            }
            HStack(spacing: 8) {
                TextField("goal lbs", text: Binding(get: { exercise.goalWeight }, set: { store.updateGoal(name, weight: $0) }))
                    .keyboardType(.decimalPad)
                    .fieldStyle()
                Button("Done") { withAnimation(.snappy) { editingGoal = false }; hideKeyboard() }
                    .font(.system(size: 12, weight: .bold))
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .foregroundStyle(Theme.green)
                    .background(Theme.green.opacity(0.13), in: RoundedRectangle(cornerRadius: 8))
            }
            if !exercise.goalReps.isEmpty && exercise.goalWeight.isEmpty {
                Text("No weight has hit \(exercise.goalReps) reps twice yet — enter one manually.")
                    .font(.system(size: 12)).foregroundStyle(Theme.muted)
            }
        }
        .padding(10)
        .card(Theme.card2, radius: 12)
        .padding(.horizontal, 16).padding(.bottom, 8)
    }

    /// Heaviest weight hit for the target reps in at least 2 sets across history.
    private func bestWeight(for reps: String, in history: [ExerciseHistoryEntry]) -> String? {
        var counts: [String: Int] = [:]
        for s in history.flatMap(\.sets) where s.reps == reps && !s.weight.isEmpty {
            counts[s.weight, default: 0] += 1
        }
        return counts.filter { $0.value >= 2 }.keys.max { ($0 == "BW" ? 0 : Double($0) ?? 0) < ($1 == "BW" ? 0 : Double($1) ?? 0) }
    }

    // MARK: Expanded

    @ViewBuilder private func expandedBody(history: [ExerciseHistoryEntry], setupNote: String, previousNote: SessionNoteEntry?) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            if !exercise.sets.isEmpty {
                HStack(spacing: 8) {
                    Color.clear.frame(width: 20, height: 1)
                    Text("WEIGHT").frame(maxWidth: .infinity)
                    Text("REPS").frame(maxWidth: .infinity)
                    Color.clear.frame(width: 30, height: 1)
                }
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Theme.muted)
                .padding(.bottom, 2)
            }

            ForEach(Array(exercise.sets.enumerated()), id: \.element.id) { i, set in
                SetRow(exerciseName: name, set: set, index: i, history: history)
            }

            Button { withAnimation(.snappy) { store.addSet(to: name) } } label: {
                Label("Add Set", systemImage: "plus")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.green)
                    .frame(maxWidth: .infinity).padding(.vertical, 9)
                    .background(Theme.raised, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.impact(weight: .medium), trigger: exercise.sets.count)
            .padding(.top, 8)

            // Setup note (permanent)
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Label("SETUP", systemImage: "wrench.adjustable")
                        .font(.system(size: 10, weight: .bold)).tracking(1.2)
                        .foregroundStyle(Theme.gold)
                    Spacer()
                    Text("Always shown").font(.system(size: 10)).foregroundStyle(Theme.dim)
                }
                TextField("Seat 3, handle low slot, pin 4th from top…", text: Binding(
                    get: { store.setupNote(for: name) },
                    set: { store.setSetupNote($0, for: name) }
                ), axis: .vertical)
                .lineLimit(1...4)
                .font(.system(size: 14))
                .foregroundStyle(Theme.gold.opacity(0.9))
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .card(Theme.card2, radius: 12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.gold.opacity(0.18)))
            .padding(.top, 12)
            .onAppear { editingSetup = false }

            // Session notes (rolling, with history)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Label("SESSION NOTE", systemImage: "note.text")
                        .font(.system(size: 10, weight: .bold)).tracking(1.2)
                        .foregroundStyle(Theme.soft)
                    Spacer()
                    if !store.sessionNotes(for: name).isEmpty {
                        Button("History") { showNotesHistory = true }
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.green)
                    }
                }
                if let previousNote {
                    VStack(alignment: .leading, spacing: 3) {
                        HStack {
                            Text("Last time · \(previousNote.date)").font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.muted)
                            Spacer()
                            if exercise.notes.isEmpty {
                                Button("Use this") { store.updateNotes(name, previousNote.text) }
                                    .font(.system(size: 11, weight: .semibold)).foregroundStyle(Theme.green)
                            }
                        }
                        Text(previousNote.text).font(.system(size: 13)).foregroundStyle(Theme.soft)
                    }
                    .padding(8)
                    .background(Theme.bg.opacity(0.5), in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Theme.field, style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                }
                TextField("Notes for today: how it felt, cues…", text: Binding(
                    get: { exercise.notes },
                    set: { store.updateNotes(name, $0) }
                ), axis: .vertical)
                .lineLimit(2...6)
                .font(.system(size: 14))
                .foregroundStyle(Color(hex: 0xAAAAAA))
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .card(Theme.card2, radius: 12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.field))
            .padding(.top, 8)
        }
        .padding(.horizontal, 16).padding(.bottom, 12)
    }
}

// MARK: - Set row

struct SetRow: View {
    @Environment(Store.self) private var store
    var exerciseName: String
    var set: LoggedSet
    var index: Int
    var history: [ExerciseHistoryEntry]

    enum Field { case weight, reps }
    @FocusState private var focused: Field?

    var body: some View {
        let isBW = set.weight == "BW"
        let currentWeight = isBW ? 0 : (Double(set.weight) ?? 0)
        let currentReps = Int(set.reps) ?? 0

        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text("\(index + 1)").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.muted).frame(width: 20)
                TextField("lbs", text: Binding(get: { set.weight }, set: { store.updateSet(exercise: exerciseName, setID: set.id, weight: $0) }))
                    .keyboardType(.decimalPad)
                    .focused($focused, equals: .weight)
                    .foregroundStyle(isBW ? Theme.green : .white)
                    .fieldStyle(isBW ? Theme.green.opacity(0.13) : Theme.field)
                    .overlay(alignment: .trailing) {
                        if !isBW { Text("lbs").font(.system(size: 11)).foregroundStyle(Theme.dim).padding(.trailing, 8) }
                    }
                TextField("reps", text: Binding(get: { set.reps }, set: { store.updateSet(exercise: exerciseName, setID: set.id, reps: $0) }))
                    .keyboardType(.numberPad)
                    .focused($focused, equals: .reps)
                    .foregroundStyle(.white)
                    .fieldStyle()
                    .overlay(alignment: .trailing) {
                        Text("reps").font(.system(size: 11)).foregroundStyle(Theme.dim).padding(.trailing, 8)
                    }
                Button { withAnimation(.snappy) { store.removeSet(exercise: exerciseName, setID: set.id) } } label: {
                    Image(systemName: "trash").font(.system(size: 14)).foregroundStyle(Theme.muted).frame(width: 30, height: 30)
                }
                .buttonStyle(.plain)
            }

            if focused == .weight {
                FlowRow(spacing: 8) {
                    if isBW {
                        ChipButton(label: "Clear BW") { setWeight("") }
                    } else {
                        ChipButton(label: "BW") { setWeight("BW") }
                        if currentWeight >= 5 { ChipButton(label: "-5") { setWeight(Fmt.number(currentWeight - 5)) } }
                        if currentWeight >= 2.5 { ChipButton(label: "-2.5") { setWeight(Fmt.number(currentWeight - 2.5)) } }
                        ChipButton(label: "+2.5") { setWeight(Fmt.number(currentWeight + 2.5)) }
                        ChipButton(label: "+5") { setWeight(Fmt.number(currentWeight + 5)) }
                        ChipButton(label: "+10") { setWeight(Fmt.number(currentWeight + 10)) }
                    }
                }
                .padding(.leading, 28)
            }

            if focused == .reps {
                FlowRow(spacing: 8) {
                    ForEach(["8", "10", "12", "15"], id: \.self) { r in ChipButton(label: r) { setReps(r) } }
                    if currentReps > 1 { ChipButton(label: "−1") { setReps(String(currentReps - 1)) } }
                    ChipButton(label: "+1") { setReps(String(currentReps + 1)) }
                }
                .padding(.leading, 28)
            }

            // Weight suggestions once reps are in but weight is empty.
            if currentReps > 0 && currentWeight == 0 && !isBW, let s = suggestions(reps: currentReps) {
                VStack(alignment: .leading, spacing: 4) {
                    suggestionButton("📊 \(Fmt.number(s.lastWeight)) lbs × \(s.lastReps) last time") { setWeight(Fmt.number(s.lastWeight)) }
                    suggestionButton("⚡ ~\(Fmt.number(s.suggested)) lbs (\(currentReps) rep est.)") { setWeight(Fmt.number(s.suggested)) }
                }
                .padding(.leading, 28)
            }
        }
        .padding(.vertical, 5)
        .animation(.snappy(duration: 0.2), value: focused)
    }

    private func setWeight(_ v: String) { store.updateSet(exercise: exerciseName, setID: set.id, weight: v) }
    private func setReps(_ v: String) { store.updateSet(exercise: exerciseName, setID: set.id, reps: v) }

    private func suggestionButton(_ text: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text).font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.soft)
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(Theme.raised, in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.field))
        }
        .buttonStyle(.plain)
    }

    /// Epley 1RM from last session's heaviest set, scaled to the entered reps.
    private func suggestions(reps: Int) -> (lastWeight: Double, lastReps: Int, suggested: Double)? {
        guard let last = history.last, var best = last.sets.first else { return nil }
        for s in last.sets where s.weightValue > best.weightValue { best = s }
        guard best.weightValue > 0 else { return nil }
        let oneRM = (best.weightValue * (1 + Double(best.repsValue) / 30)).rounded()
        let factors: [Int: Double] = [1: 1.0, 2: 0.95, 3: 0.93, 4: 0.90, 5: 0.87, 6: 0.85, 7: 0.83, 8: 0.80, 9: 0.77, 10: 0.75, 11: 0.72, 12: 0.67, 13: 0.65, 14: 0.62, 15: 0.60]
        let suggested = (oneRM * (factors[min(reps, 15)] ?? 0.6) / 2.5).rounded() * 2.5
        guard suggested > 0 else { return nil }
        return (best.weightValue, best.repsValue, suggested)
    }
}

// MARK: - Exercise name with descriptor tags

struct ExerciseNameLabel: View {
    var name: String
    var currentEquip: String?

    private static let equipTagMap = ["KB": "KB", "DB": "DB", "BB": "BB", "EZ": "EZ", "Cable": "Cable", "Machine": "Machine", "MAG": "Cable", "HB": "Hex"]

    var body: some View {
        let parsed = ExerciseCatalog.parseDisplay(name)
        // Drop tags that duplicate the (editable) equipment badge.
        let tags = parsed.tags.filter { Self.equipTagMap[$0] == nil || Self.equipTagMap[$0] != currentEquip }
        HStack(spacing: 6) {
            Text(parsed.displayName).font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                .multilineTextAlignment(.leading)
            ForEach(tags, id: \.self) { Tag(text: $0, color: Theme.equipColor($0)) }
        }
    }
}

// MARK: - Simple wrapping layout

struct FlowRow: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0, widest: CGFloat = 0
        for v in subviews {
            let size = v.sizeThatFits(.unspecified)
            let w = min(size.width, maxWidth)
            if x > 0 && x + w > maxWidth { y += rowHeight + spacing; x = 0; rowHeight = 0 }
            x += w + spacing
            widest = max(widest, x - spacing)
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: proposal.width ?? widest, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for v in subviews {
            let size = v.sizeThatFits(.unspecified)
            let w = min(size.width, bounds.width)
            if x > bounds.minX && x + w > bounds.maxX { y += rowHeight + spacing; x = bounds.minX; rowHeight = 0 }
            let rowH = size.height
            v.place(at: CGPoint(x: x, y: y), anchor: .topLeading, proposal: ProposedViewSize(width: w, height: rowH))
            x += w + spacing
            rowHeight = max(rowHeight, rowH)
        }
    }
}

/// Equipment chips; tapping the selected one clears it (back to automatic).
struct EquipmentPicker: View {
    var selected: String?
    var onPick: (String?) -> Void

    var body: some View {
        FlowRow(spacing: 6) {
            ForEach(ExerciseCatalog.equipmentOptions, id: \.self) { opt in
                let tag = ExerciseCatalog.equipmentTags[opt.lowercased()] ?? opt
                Pill(text: opt, selected: selected == opt, color: Theme.equipColor(tag)) {
                    onPick(selected == opt ? nil : opt)
                }
            }
        }
    }
}
