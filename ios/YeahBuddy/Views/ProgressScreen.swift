import Charts
import SwiftUI

/// Port of ProgressView.jsx (Workouts + Exercises views; the Insights dashboard was dropped).
struct ProgressScreen: View {
    @Environment(Store.self) private var store
    @State private var view = 0
    @State private var search = ""
    @State private var selected: ExerciseDef?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        stat(icon: "flame.fill", color: Theme.orange, value: streak(), label: "day streak")
                        stat(icon: "calendar", color: Theme.green, value: store.data.workouts.count, label: "total workouts")
                    }
                    Picker("", selection: $view) {
                        Text("Workouts").tag(0)
                        Text("Exercises").tag(1)
                    }
                    .pickerStyle(.segmented)

                    if view == 0 { workoutsList } else { exercisesList }
                }
                .padding(.horizontal, 16).padding(.bottom, 24)
            }
            .screenBackground()
            .navigationTitle("Progress")
            .searchable(text: $search, prompt: view == 0 ? "Search workouts..." : "Search exercises...")
            .sheet(item: $selected) { ExerciseProgressSheet(exercise: $0) }
        }
    }

    private func stat(icon: String, color: Color, value: Int, label: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 22)).foregroundStyle(color)
            VStack(alignment: .leading, spacing: 0) {
                Text("\(value)").font(.system(size: 24, weight: .bold)).foregroundStyle(.white)
                Text(label).font(.system(size: 12)).foregroundStyle(Color(hex: 0x666666))
            }
            Spacer()
        }
        .padding(16).card()
    }

    @ViewBuilder private var workoutsList: some View {
        let q = search.lowercased()
        let list = q.isEmpty ? store.data.workouts : store.data.workouts.filter {
            $0.title.lowercased().contains(q) || $0.exercises.contains { $0.name.lowercased().contains(q) }
        }
        if list.isEmpty {
            EmptyState(icon: "chart.line.uptrend.xyaxis", text: store.data.workouts.isEmpty ? "Log your first workout to see history here" : "No workouts found")
        } else {
            LazyVStack(spacing: 10) { ForEach(list) { SessionCard(workout: $0) } }
        }
    }

    @ViewBuilder private var exercisesList: some View {
        let q = search.lowercased()
        let items = store.allExercises
            .filter { q.isEmpty || $0.name.lowercased().contains(q) }
            .map { ($0, store.history(for: $0.name)) }
            .filter { !$0.1.isEmpty }
        if items.isEmpty {
            EmptyState(icon: "chart.line.uptrend.xyaxis", text: store.data.workouts.isEmpty ? "Log your first workout to see progress here" : "No exercises found")
        } else {
            LazyVStack(spacing: 8) {
                ForEach(items, id: \.0.name) { ex, history in
                    let pr = history.map(\.maxWeight).max() ?? 0
                    let trend = history.count >= 2 ? history[history.count - 1].maxWeight - history[history.count - 2].maxWeight : nil
                    Button { selected = ex } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(ex.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                                Text("\(history.count) session\(history.count == 1 ? "" : "s") · PR: \(pr > 0 ? "\(Fmt.number(pr)) lbs" : "—")")
                                    .font(.system(size: 12)).foregroundStyle(Theme.muted)
                            }
                            Spacer()
                            if let trend {
                                Text(trend > 0 ? "+\(Fmt.number(trend))" : trend == 0 ? "→" : Fmt.number(trend))
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(trend > 0 ? Theme.green : trend < 0 ? Theme.red : Theme.soft)
                            }
                            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Color(hex: 0x374151))
                        }
                        .padding(.horizontal, 16).padding(.vertical, 12).card()
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func streak() -> Int {
        let days = Set(store.data.workouts.map(\.date)).compactMap { DateFormatter.ymd.date(from: $0) }.sorted(by: >)
        var current = Calendar.current.startOfDay(for: Date())
        var count = 0
        for d in days {
            let diff = Calendar.current.dateComponents([.day], from: d, to: current).day ?? 99
            if diff <= 1 { count += 1; current = d } else { break }
        }
        return count
    }
}

private struct SessionCard: View {
    var workout: Workout
    @State private var expanded = false
    @State private var copied = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { withAnimation(.snappy) { expanded.toggle() } } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(workout.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                        Text("\(workout.date) · \(workout.exercises.count) exercises · \(workout.totalSets) sets\(workout.durationMinutes.map { " · \($0)m" } ?? "")")
                            .font(.system(size: 12)).foregroundStyle(Theme.muted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                Button {
                    UIPasteboard.general.string = summary()
                    copied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
                } label: {
                    Label(copied ? "Copied!" : "Summary", systemImage: "doc.on.doc")
                        .font(.system(size: 12, weight: .semibold))
                        .padding(.horizontal, 10).padding(.vertical, 6)
                        .foregroundStyle(copied ? Theme.green : Theme.muted)
                        .background(copied ? Theme.green.opacity(0.13) : Theme.raised, in: Capsule())
                        .overlay(Capsule().stroke(Theme.field))
                }
                .buttonStyle(.plain)
                .sensoryFeedback(.success, trigger: copied) { _, new in new }
                Image(systemName: expanded ? "chevron.up" : "chevron.down").font(.system(size: 13)).foregroundStyle(Theme.dim)
            }
            .padding(.horizontal, 16).padding(.vertical, 12)

            if expanded {
                Divider().overlay(Theme.border)
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(workout.exercises) { ExercisePreviewRow(exercise: $0) }
                    if !workout.notes.isEmpty {
                        Divider().overlay(Theme.border).padding(.vertical, 8)
                        SectionLabel(text: "Notes")
                        Text(workout.notes).font(.system(size: 14)).foregroundStyle(Theme.soft).padding(.top, 4)
                    }
                }
                .padding(.horizontal, 16).padding(.vertical, 8)
            }
        }
        .card()
    }

    /// Plain-text workout summary for sharing (same format as the web).
    private func summary() -> String {
        let volume = workout.exercises.reduce(0.0) { acc, e in acc + e.sets.reduce(0.0) { $0 + Double($1.repsValue) * $1.weightValue } }
        var text = "🏋️ \(workout.name ?? workout.split) · \(workout.date)"
        if let mins = workout.durationMinutes, mins > 0 { text += " · \(mins) min" }
        text += "\n\n"
        for ex in workout.exercises {
            text += "\(ex.name)\n"
            for (i, s) in ex.sets.enumerated() {
                let w = s.weight == "BW" ? "BW" : s.weight.isEmpty ? "" : "\(s.weight) lbs"
                let r = s.reps.isEmpty ? "" : "\(s.reps) reps"
                text += "  Set \(i + 1): \([w, r].filter { !$0.isEmpty }.joined(separator: " × "))\n"
            }
        }
        text += "\nTotal: \(workout.exercises.count) exercises · \(workout.totalSets) sets"
        if volume > 0 { text += " · \(Int(volume).formatted()) lbs volume" }
        text += "\n\nLogged with YEAH BUDDY 💪"
        return text
    }
}

struct ExerciseProgressSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    var exercise: ExerciseDef

    var body: some View {
        let history = store.history(for: exercise.name)
        let pr = history.map(\.maxWeight).max() ?? 0
        let trend = history.count >= 2 ? history[history.count - 1].maxWeight - history[history.count - 2].maxWeight : 0

        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    HStack(spacing: 12) {
                        box("PR", pr > 0 ? Fmt.number(pr) : "—", "lbs", .white)
                        box("Sessions", "\(history.count)", nil, .white)
                        box("Last Change", trend > 0 ? "+\(Fmt.number(trend))" : trend == 0 ? "—" : Fmt.number(trend), "lbs",
                            trend > 0 ? Theme.green : trend < 0 ? Theme.red : Theme.soft)
                    }

                    if history.count >= 2 {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Max Weight Over Time").font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                            Chart(Array(history.enumerated()), id: \.offset) { i, h in
                                LineMark(x: .value("Session", i), y: .value("lbs", h.maxWeight))
                                    .interpolationMethod(.monotone)
                                    .foregroundStyle(Theme.green)
                                    .lineStyle(StrokeStyle(lineWidth: 2.5))
                                PointMark(x: .value("Session", i), y: .value("lbs", h.maxWeight))
                                    .foregroundStyle(Theme.green)
                            }
                            .chartXAxis {
                                AxisMarks(values: Array(history.indices)) { v in
                                    AxisValueLabel {
                                        if let i = v.as(Int.self), i < history.count { Text(String(history[i].date.dropFirst(5))) }
                                    }
                                    .foregroundStyle(Theme.muted)
                                }
                            }
                            .chartYAxis { AxisMarks { AxisGridLine().foregroundStyle(Theme.border); AxisValueLabel().foregroundStyle(Theme.muted) } }
                            .frame(height: 180)
                        }
                        .padding(16).card()
                    } else {
                        EmptyState(icon: "chart.line.uptrend.xyaxis", text: "Log at least 2 sessions to see your progress chart").card()
                    }

                    SectionLabel(text: "Session History", color: Color(hex: 0x666666))
                    VStack(spacing: 0) {
                        ForEach(Array(history.reversed().enumerated()), id: \.offset) { i, h in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(h.date).font(.system(size: 14, weight: .medium)).foregroundStyle(.white)
                                    Text("\(h.sets.count) sets").font(.system(size: 12)).foregroundStyle(Theme.muted)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("\(Fmt.number(h.maxWeight)) lbs").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                                    Text("max").font(.system(size: 12)).foregroundStyle(Theme.muted)
                                }
                            }
                            .padding(.horizontal, 16).padding(.vertical, 12)
                            if i < history.count - 1 { Divider().overlay(Theme.border) }
                        }
                    }
                    .card()
                }
                .padding(16)
            }
            .screenBackground()
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Image(systemName: "xmark") } } }
        }
    }

    private func box(_ title: String, _ value: String, _ unit: String?, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(title.uppercased()).font(.system(size: 11, weight: .bold)).foregroundStyle(Color(hex: 0x666666))
            Text(value).font(.system(size: 18, weight: .bold)).foregroundStyle(color)
            if let unit { Text(unit).font(.system(size: 12)).foregroundStyle(Theme.muted) }
        }
        .frame(maxWidth: .infinity).padding(.vertical, 16).card()
    }
}
