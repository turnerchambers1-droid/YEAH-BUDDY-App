import SwiftUI

/// Port of WorkoutLogger.jsx: start screen when idle, live logger when a workout is running.
struct WorkoutView: View {
    @Environment(Store.self) private var store

    var body: some View {
        NavigationStack {
            Group {
                if store.data.activeWorkout != nil {
                    ActiveWorkoutView()
                } else {
                    StartWorkoutView()
                }
            }
            .screenBackground()
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

// MARK: - Start screen

struct StartWorkoutView: View {
    @Environment(Store.self) private var store
    @State private var showCustom = false
    @State private var showImport = false
    @State private var editing: Workout?
    @State private var tileName = ""
    @State private var deleting: Workout?

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                VStack(spacing: 4) {
                    (Text("YEAH ").foregroundStyle(.white) + Text("BUDDY").foregroundStyle(Theme.green))
                        .font(.system(size: 46, weight: .black))
                        .tracking(-1)
                    Text(dailyTagline())
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.muted)
                }
                .padding(.top, 24).padding(.bottom, 16)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Start Workout").font(.title3.bold()).foregroundStyle(.white)
                    Text(store.data.userName.isEmpty ? "Choose your split" : "Hey \(store.data.userName) 👋")
                        .font(.subheadline).foregroundStyle(Theme.muted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)

                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                    ForEach(ExerciseCatalog.splits, id: \.self) { split in
                        StartTile(title: ExerciseCatalog.splitLabel(split), subtitle: "Tap to start", border: Theme.border) {
                            store.startWorkout(split: split)
                        }
                    }
                    StartTile(title: "Custom", subtitle: "Build your own", border: Theme.green.opacity(0.33), dashed: true, titleColor: Theme.green, icon: "pencil") {
                        showCustom = true
                    }
                    ForEach(store.data.homeTiles) { tile in
                        StartTile(title: tile.name, subtitle: "\(tile.exercises.count) exercises", border: Theme.green.opacity(0.27)) {
                            store.startWorkout(split: "custom", name: tile.name, exercises: tile.exercises)
                        }
                        .contextMenu {
                            Button("Remove Tile", systemImage: "trash", role: .destructive) { store.deleteHomeTile(tile.id) }
                        }
                    }
                }
                .padding(.horizontal, 16).padding(.top, 12)

                Button { showImport = true } label: {
                    Label("Log a past workout from text or photo", systemImage: "text.badge.plus")
                        .font(.system(size: 13, weight: .semibold))
                        .frame(maxWidth: .infinity).padding(.vertical, 12)
                        .foregroundStyle(Theme.soft)
                        .card(radius: 12)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16).padding(.top, 12)

                if !store.data.workouts.isEmpty {
                    SectionLabel(text: "Recent — swipe left or long press")
                        .padding(.horizontal, 16).padding(.top, 24).padding(.bottom, 10)
                    VStack(spacing: 8) {
                        ForEach(store.data.workouts.prefix(5)) { w in
                            RecentWorkoutCard(workout: w,
                                              onEdit: { editing = w },
                                              onStartAgain: { store.startWorkout(split: w.split, name: w.name, exercises: w.exercises.map(\.name)) },
                                              onArchive: { withAnimation { store.archive(w.id) } },
                                              onDelete: { deleting = w })
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
            .padding(.bottom, 32)
        }
        .sheet(isPresented: $showImport) { ImportWorkoutSheet() }
        .sheet(isPresented: $showCustom) {
            CustomWorkoutSheet { name, exercises in
                store.startWorkout(split: "custom", name: name, exercises: exercises)
            }
        }
        .alert("Save as new workout?", isPresented: Binding(get: { store.pendingTilePrompt != nil }, set: { if !$0 { store.pendingTilePrompt = nil } })) {
            TextField("e.g. \"Push A\", \"Upper Body\"", text: $tileName)
            Button("No thanks", role: .cancel) { tileName = "" }
            Button("Save Tile") {
                let name = tileName.trimmingCharacters(in: .whitespaces)
                if let w = store.pendingTilePrompt, !name.isEmpty { store.saveHomeTile(name: name, exercises: w.exercises.map(\.name)) }
                tileName = ""
            }
        } message: {
            Text("Add this to your home screen for quick access next time.")
        }
        .onChange(of: store.pendingTilePrompt) { _, w in tileName = w?.name ?? "" }
        .sheet(item: $editing) { w in
            EditWorkoutSheet(workout: w) { store.updateWorkout($0) }
        }
        .alert("Delete workout?", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }), presenting: deleting) { w in
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { withAnimation { store.softDelete(w.id) } }
        } message: { w in
            Text("\(w.title) · \(w.date)\nRecoverable from Recently Deleted for 3 days.")
        }
    }
}

private struct StartTile: View {
    var title: String
    var subtitle: String
    var border: Color
    var dashed = false
    var titleColor: Color = .white
    var icon: String? = nil
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    if let icon { Image(systemName: icon).font(.system(size: 13, weight: .bold)) }
                    Text(title).font(.system(size: 16, weight: .bold)).lineLimit(1)
                }
                .foregroundStyle(titleColor)
                Text(subtitle).font(.system(size: 12)).foregroundStyle(Theme.muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .card()
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(border, style: StrokeStyle(lineWidth: 1, dash: dashed ? [5, 4] : []))
            )
        }
        .buttonStyle(PressableStyle())
    }
}

struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.spring(duration: 0.2), value: configuration.isPressed)
    }
}

/// Recent workout row: tap to expand, swipe for Edit/Archive/Delete, long-press for the full menu.
struct RecentWorkoutCard: View {
    var workout: Workout
    var onEdit: () -> Void
    var onStartAgain: () -> Void
    var onArchive: () -> Void
    var onDelete: () -> Void
    @State private var expanded = false

    var body: some View {
        VStack(spacing: 0) {
            Button { withAnimation(.snappy) { expanded.toggle() } } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(workout.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                        Text("\(workout.date) · \(workout.exercises.count) exercise\(workout.exercises.count == 1 ? "" : "s")")
                            .font(.system(size: 12)).foregroundStyle(Theme.muted)
                    }
                    Spacer()
                    if let mins = workout.durationMinutes {
                        Text("\(mins)m").font(.system(size: 12))
                            .padding(.horizontal, 12).padding(.vertical, 4)
                            .foregroundStyle(Theme.green)
                            .background(Theme.green.opacity(0.07), in: Capsule())
                    }
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12)).foregroundStyle(Theme.dim)
                }
                .padding(.horizontal, 16).padding(.vertical, 12)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if expanded && !workout.exercises.isEmpty {
                Divider().overlay(Theme.border)
                VStack(spacing: 0) {
                    ForEach(workout.exercises) { ExercisePreviewRow(exercise: $0) }
                }
                .padding(.horizontal, 16).padding(.vertical, 6)
            }
        }
        .card()
        .contextMenu {
            Button("Edit", systemImage: "square.and.pencil", action: onEdit)
            Button("Start Again", systemImage: "bolt.fill", action: onStartAgain)
            Button("Archive", systemImage: "archivebox", action: onArchive)
            Button("Delete", systemImage: "trash", role: .destructive, action: onDelete)
        }
        .swipeToReveal(actions: [
            .init(label: "Edit", icon: "square.and.pencil", color: Theme.soft, action: onEdit),
            .init(label: "Archive", icon: "archivebox", color: Theme.soft, action: onArchive),
            .init(label: "Delete", icon: "trash", color: Theme.red, action: onDelete),
        ])
    }
}

struct ExercisePreviewRow: View {
    var exercise: LoggedExercise
    var body: some View {
        HStack(spacing: 12) {
            ExerciseThumb(name: exercise.name, size: 36)
            VStack(alignment: .leading, spacing: 1) {
                Text(exercise.name).font(.system(size: 12, weight: .semibold)).foregroundStyle(.white).lineLimit(1)
                if let top = exercise.topSet {
                    Text("\(exercise.sets.count) set\(exercise.sets.count == 1 ? "" : "s")\(top.weight == "BW" ? " · BW" : top.weight.isEmpty ? "" : " · \(top.weight) lbs")\(top.reps.isEmpty ? "" : " × \(top.reps)")")
                        .font(.system(size: 12)).foregroundStyle(Theme.muted)
                }
            }
            Spacer()
        }
        .padding(.vertical, 6)
    }
}

/// Rotating daily tagline (same pools as the web app).
func dailyTagline() -> String {
    let h = Calendar.current.component(.hour, from: Date())
    let day = Calendar.current.component(.day, from: Date())
    let morning = ["Good morning, handsome 💪", "Rise and grind, king 👑", "Early bird gets the gains ☀️", "Morning pump hits different 🌅"]
    let afternoon = ["No excuses, get in here 🔥", "Get up, lazy bum 🦁", "Time to earn it 💯", "Midday grind, let's go ⚡"]
    let evening = ["Get in loser, we're going lifting 🚗", "Evening grind is underrated 🌙", "Last one of the day — make it count 🎯", "Champions don't skip night sessions 🏆"]
    let pool = (5..<12).contains(h) ? morning : (12..<18).contains(h) ? afternoon : evening
    return pool[day % pool.count]
}

// MARK: - Swipe-to-reveal (cards aren't in a List, so build it)

struct SwipeAction {
    var label: String
    var icon: String
    var color: Color
    var action: () -> Void
}

private struct SwipeToReveal: ViewModifier {
    var actions: [SwipeAction]
    @State private var offset: CGFloat = 0
    @State private var open = false
    private var width: CGFloat { CGFloat(actions.count) * 64 }

    func body(content: Content) -> some View {
        ZStack(alignment: .trailing) {
            HStack(spacing: 4) {
                ForEach(actions.indices, id: \.self) { i in
                    let a = actions[i]
                    Button {
                        withAnimation(.snappy) { offset = 0; open = false }
                        a.action()
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: a.icon).font(.system(size: 15))
                            Text(a.label).font(.system(size: 9))
                        }
                        .foregroundStyle(a.color)
                        .frame(width: 58)
                        .frame(maxHeight: .infinity)
                        .background(a.color == Theme.red ? Theme.red.opacity(0.13) : Theme.field, in: RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 6)
            .opacity(offset < 0 ? 1 : 0)

            content.offset(x: offset)
        }
        .clipped()
        .simultaneousGesture(
            DragGesture(minimumDistance: 20)
                .onChanged { v in
                    guard abs(v.translation.width) > abs(v.translation.height) else { return }
                    let base: CGFloat = open ? -width : 0
                    offset = min(0, max(-width - 20, base + v.translation.width))
                }
                .onEnded { v in
                    withAnimation(.snappy) {
                        open = offset < -width / 2
                        offset = open ? -width : 0
                    }
                }
        )
    }
}

extension View {
    func swipeToReveal(actions: [SwipeAction]) -> some View { modifier(SwipeToReveal(actions: actions)) }
}
