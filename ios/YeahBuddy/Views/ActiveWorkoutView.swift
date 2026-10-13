import SwiftUI

struct ActiveWorkoutView: View {
    @Environment(Store.self) private var store
    @State private var expanded: Set<UUID> = []
    @State private var showSelector = false
    @State private var showFinish = false
    @State private var showLastSplit = false
    @State private var editingTitle = false
    @State private var titleInput = ""
    @FocusState private var titleFocused: Bool

    var body: some View {
        if let workout = store.data.activeWorkout {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 0) {
                        header(workout)
                        VStack(spacing: 12) {
                            lastSameSplit(workout)

                            if workout.exercises.isEmpty {
                                VStack(spacing: 10) {
                                    Image(systemName: "plus").font(.system(size: 36, weight: .light))
                                    Text("Tap below to add your first exercise").font(.subheadline)
                                }
                                .foregroundStyle(Theme.dim)
                                .padding(.vertical, 56)
                            }

                            ForEach(workout.exercises) { ex in
                                ExerciseCard(
                                    exercise: ex,
                                    workoutSplit: workout.split,
                                    isCurrent: store.data.currentExercise == ex.name,
                                    expanded: expanded.contains(ex.id),
                                    onToggleExpand: {
                                        withAnimation(.snappy) {
                                            if expanded.contains(ex.id) { expanded.remove(ex.id) } else { expanded.insert(ex.id); store.setCurrentExercise(ex.name) }
                                        }
                                    }
                                )
                                .id(ex.id)
                            }

                            // Timer stays mounted in one place so expanding cards never resets it.
                            RestTimerView(inline: true)

                            Button { showSelector = true } label: {
                                Label("Add Exercise", systemImage: "plus")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(Theme.green)
                                    .frame(maxWidth: .infinity).padding(.vertical, 16)
                                    .card()
                                    .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.border, style: StrokeStyle(lineWidth: 1, dash: [5, 4])))
                            }
                            .buttonStyle(.plain)

                            workoutNotes(workout)
                        }
                        .padding(.horizontal, 16).padding(.top, 16)
                    }
                    .padding(.bottom, 40)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: store.focusRequest) { _, name in reveal(name, proxy: proxy) }
                .onAppear { reveal(store.focusRequest, proxy: proxy) }
            }
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") { hideKeyboard() }.fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showSelector) {
                ExerciseSelector(currentExercises: workout.exercises.map(\.name), split: workout.split) { name in
                    store.addExercise(name)
                    if let ex = store.data.activeWorkout?.exercises.first(where: { $0.name == name }) { expanded.insert(ex.id) }
                }
            }
            .alert("Finish workout?", isPresented: $showFinish) {
                Button("Cancel", role: .cancel) {}
                Button("Discard Workout", role: .destructive) { store.discardWorkout() }
                Button("Save Workout") {
                    let wasCustom = workout.split == "custom"
                    if let done = store.finishWorkout(), wasCustom { store.pendingTilePrompt = done }
                }
            } message: {
                Text("\(workout.exercises.count) exercise\(workout.exercises.count == 1 ? "" : "s") · \(elapsedString(since: workout.startTime))")
            }
        }
    }

    private func reveal(_ name: String?, proxy: ScrollViewProxy) {
        guard let name, let ex = store.data.activeWorkout?.exercises.first(where: { $0.name == name }) else { return }
        expanded.insert(ex.id)
        withAnimation { proxy.scrollTo(ex.id, anchor: .top) }
        store.focusRequest = nil
    }

    @ViewBuilder private func header(_ workout: Workout) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                if editingTitle {
                    TextField("Workout name", text: $titleInput)
                        .font(.system(size: 18, weight: .bold))
                        .focused($titleFocused)
                        .submitLabel(.done)
                        .onSubmit { commitTitle() }
                        .onChange(of: titleFocused) { _, f in if !f { commitTitle() } }
                } else {
                    Button {
                        titleInput = workout.title
                        editingTitle = true
                        titleFocused = true
                    } label: {
                        HStack(spacing: 8) {
                            Text(workout.title).font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                            Image(systemName: "pencil").font(.system(size: 13)).foregroundStyle(Theme.dim)
                        }
                    }
                    .buttonStyle(.plain)
                }
                Text(workout.startTime, style: .timer)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundStyle(Theme.green)
            }
            Spacer()
            Button("Finish") { showFinish = true }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.black)
                .padding(.horizontal, 16).padding(.vertical, 10)
                .background(Theme.green, in: RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 12)
        .overlay(alignment: .bottom) { Rectangle().fill(Theme.card).frame(height: 1) }
    }

    private func commitTitle() {
        guard editingTitle else { return }
        store.updateActiveWorkoutName(titleInput)
        editingTitle = false
    }

    @ViewBuilder private func lastSameSplit(_ workout: Workout) -> some View {
        let last = workout.split == "custom" ? [] : Array(store.data.workouts.filter { $0.split == workout.split }.prefix(3))
        if !last.isEmpty {
            VStack(spacing: 0) {
                Button { withAnimation(.snappy) { showLastSplit.toggle() } } label: {
                    HStack(spacing: 6) {
                        Text("LAST \(last.count > 1 ? "\(last.count)X " : "")\(ExerciseCatalog.splitLabel(workout.split).uppercased())")
                            .font(.system(size: 11, weight: .bold)).tracking(1.5).foregroundStyle(Theme.muted)
                        Text("· \(last[0].date)").font(.system(size: 12)).foregroundStyle(Theme.dim)
                        Spacer()
                        Image(systemName: showLastSplit ? "chevron.up" : "chevron.down").foregroundStyle(Theme.dim)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if showLastSplit {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(last.enumerated()), id: \.element.id) { i, w in
                            if i > 0 {
                                SectionLabel(text: w.date, color: Theme.dim).padding(.top, 12).padding(.bottom, 6)
                            }
                            ForEach(w.exercises) { ex in
                                HStack {
                                    Text(ex.name).font(.system(size: 14)).foregroundStyle(.white)
                                    Spacer()
                                    Text(summary(ex)).font(.system(size: 12)).foregroundStyle(Theme.muted)
                                }
                                .padding(.vertical, 6)
                                .overlay(alignment: .bottom) { Rectangle().fill(Theme.card2).frame(height: 1) }
                            }
                        }
                    }
                    .padding(.horizontal, 16).padding(.bottom, 12)
                }
            }
            .card()
        }
    }

    private func summary(_ ex: LoggedExercise) -> String {
        var s = "\(ex.sets.count)s"
        if let top = ex.topSet {
            if !top.weight.isEmpty { s += " · " + (top.weight == "BW" ? "BW" : "\(top.weight) lbs") }
            if !top.reps.isEmpty { s += " × \(top.reps)" }
        }
        return s
    }

    @ViewBuilder private func workoutNotes(_ workout: Workout) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("WORKOUT NOTES")
                .font(.system(size: 11, weight: .bold, design: .monospaced)).tracking(1.5)
                .foregroundStyle(Theme.gold)
            TextField("Add notes for this workout...", text: Binding(
                get: { store.data.activeWorkout?.notes ?? "" },
                set: { store.updateWorkoutNotes($0) }
            ), axis: .vertical)
            .lineLimit(3...8)
            .font(.system(size: 15))
            .foregroundStyle(Color(hex: 0xCCCCCC))
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .card(Theme.timerBg)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.field, lineWidth: 1))
        .padding(.top, 4)
    }
}

func elapsedString(since start: Date) -> String {
    let s = Int(Date().timeIntervalSince(start))
    let h = s / 3600, m = (s % 3600) / 60, sec = s % 60
    return h > 0 ? String(format: "%d:%02d:%02d", h, m, sec) : String(format: "%02d:%02d", m, sec)
}

func hideKeyboard() {
    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
}
