import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

@main
struct YeahBuddyWidgetBundle: WidgetBundle {
    var body: some Widget {
        WorkoutLiveActivity()
    }
}

private enum C {
    static let green = Color(red: 0x22 / 255, green: 0xC5 / 255, blue: 0x5E / 255)
    static let gold = Color(red: 0xC8 / 255, green: 0xB9 / 255, blue: 0x7A / 255)
    static let orange = Color(red: 0xF9 / 255, green: 0x73 / 255, blue: 0x16 / 255)
    static let button = Color(white: 0.17)
    static let muted = Color(white: 0.45)
}

private let deepLink = URL(string: "yeahbuddy://exercise")!

/// What the island is showing right now.
private enum Phase {
    case resting(ClosedRange<Date>)
    case lift      // rest just ended (content went stale at restEnd)
    case idle

    init(_ context: ActivityViewContext<WorkoutActivityAttributes>) {
        let s = context.state
        if let start = s.restStart, let end = s.restEnd, end > start {
            self = context.isStale || end <= Date() ? .lift : .resting(start...end)
        } else {
            self = .idle
        }
    }
}

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            LockScreenView(context: context)
                .activityBackgroundTint(Color.black.opacity(0.85))
                .activitySystemActionForegroundColor(C.green)
                .widgetURL(deepLink)
        } dynamicIsland: { context in
            let s = context.state
            let phase = Phase(context)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(s.exerciseName).font(.system(size: 14, weight: .bold)).lineLimit(1)
                            if s.isPR { PRBadge() }
                        }
                        SetLine(state: s).font(.system(size: 12)).foregroundStyle(C.muted)
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    RestRing(phase: phase, size: 44, lineWidth: 4, fontSize: 11)
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Controls(state: s, compact: true)
                        .padding(.top, 4)
                }
            } compactLeading: {
                CompactLeading(phase: phase, isPR: s.isPR)
            } compactTrailing: {
                CompactTrailing(phase: phase, state: s)
            } minimal: {
                switch phase {
                case .resting(let range):
                    ProgressView(timerInterval: range, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                        .progressViewStyle(.circular)
                        .tint(C.green)
                case .lift:
                    Image(systemName: "flame.fill").foregroundStyle(C.orange)
                case .idle:
                    Image(systemName: s.isPR ? "trophy.fill" : "dumbbell.fill").foregroundStyle(s.isPR ? C.gold : C.green)
                }
            }
            .widgetURL(deepLink)
            .keylineTint(phase.isLift ? C.orange : C.green)
        }
    }
}

private extension Phase {
    var isLift: Bool { if case .lift = self { return true } else { return false } }
}

// MARK: - Compact island

private struct CompactLeading: View {
    let phase: Phase
    let isPR: Bool

    var body: some View {
        Group {
            switch phase {
            case .resting(let range):
                ProgressView(timerInterval: range, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                    .progressViewStyle(.circular)
                    .tint(C.green)
                    .frame(width: 22, height: 22)
            case .lift:
                Image(systemName: "flame.fill")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(C.orange)
            case .idle:
                Image(systemName: isPR ? "trophy.fill" : "dumbbell.fill")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(isPR ? C.gold : C.green)
            }
        }
        .contentTransition(.symbolEffect(.replace))
    }
}

private struct CompactTrailing: View {
    let phase: Phase
    let state: WorkoutActivityAttributes.ContentState

    var body: some View {
        switch phase {
        case .resting(let range):
            // System-driven countdown digits: tick every second with the app closed.
            Text(timerInterval: range, countsDown: true)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(C.green)
                .multilineTextAlignment(.trailing)
                .frame(width: 42)
        case .lift:
            Text("LIFT!")
                .font(.system(size: 14, weight: .black, design: .rounded))
                .foregroundStyle(C.orange)
        case .idle:
            Text(state.lastWeight.isEmpty ? "Set \(state.setCount)" : Fmt.weight(state.lastWeight))
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(state.isPR ? C.gold : .white)
                .contentTransition(.numericText(value: Fmt.value(state.lastWeight)))
        }
    }
}

// MARK: - Shared bits

private struct SetLine: View {
    let state: WorkoutActivityAttributes.ContentState

    var body: some View {
        if state.setCount == 0 {
            Text("No sets yet")
        } else {
            HStack(spacing: 3) {
                Text("Set")
                Text("\(state.setCount)").contentTransition(.numericText(value: Double(state.setCount)))
                Text("· Last \(Fmt.weight(state.lastWeight)) × \(state.lastReps.isEmpty ? "—" : state.lastReps)")
            }
            .lineLimit(1)
        }
    }
}

private struct PRBadge: View {
    var body: some View {
        Label("PR", systemImage: "trophy.fill")
            .font(.system(size: 10, weight: .black))
            .foregroundStyle(.black)
            .padding(.horizontal, 5).padding(.vertical, 1)
            .background(C.gold, in: Capsule())
    }
}

// MARK: - Lock screen / banner

private struct LockScreenView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>

    var body: some View {
        let s = context.state
        let phase = Phase(context)
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    // Brand line folded into this row to free height for the big Add Set button
                    // (iOS clips lock screen Live Activities taller than 160pt).
                    HStack(spacing: 6) {
                        Text(s.exerciseName).font(.system(size: 17, weight: .bold)).foregroundStyle(.white).lineLimit(1)
                        if s.isPR { PRBadge() }
                        Text(timerInterval: context.attributes.workoutStart...Date.distantFuture, countsDown: false)
                            .font(.system(size: 10, weight: .semibold, design: .monospaced)).foregroundStyle(C.muted)
                            .frame(width: 52, alignment: .leading)
                    }
                    if phase.isLift {
                        Text("Rest over — LIFT! 💪").font(.system(size: 13, weight: .bold)).foregroundStyle(C.orange)
                    } else {
                        SetLine(state: s).font(.system(size: 13, weight: .medium)).foregroundStyle(Color(white: 0.7))
                    }
                }
                Spacer(minLength: 0)
                RestRing(phase: phase, size: 46, lineWidth: 5, fontSize: 12)
            }
            Controls(state: s, compact: false)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }
}

// MARK: - Countdown ring (system-driven: animates with the app closed)

private struct RestRing: View {
    let phase: Phase
    let size: CGFloat
    let lineWidth: CGFloat
    let fontSize: CGFloat

    var body: some View {
        ZStack {
            switch phase {
            case .resting(let range):
                ProgressView(timerInterval: range, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                    .progressViewStyle(.circular)
                    .tint(C.green)
                    .frame(width: size, height: size)
                Text(timerInterval: range, countsDown: true)
                    .font(.system(size: fontSize, weight: .bold, design: .monospaced))
                    .multilineTextAlignment(.center)
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .frame(width: size - lineWidth * 2 - 2)
                    .minimumScaleFactor(0.6)
            case .lift:
                Circle().fill(C.orange.opacity(0.18)).frame(width: size, height: size)
                Circle().stroke(C.orange, lineWidth: lineWidth).frame(width: size, height: size)
                VStack(spacing: 0) {
                    Image(systemName: "flame.fill").font(.system(size: fontSize + 3, weight: .bold))
                    Text("GO").font(.system(size: fontSize - 2, weight: .black, design: .rounded))
                }
                .foregroundStyle(C.orange)
            case .idle:
                Circle().stroke(C.green.opacity(0.25), lineWidth: lineWidth).frame(width: size, height: size)
                Image(systemName: "timer").font(.system(size: fontSize + 2, weight: .semibold)).foregroundStyle(C.green)
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Interactive controls (iOS 17 App Intents; no text fields allowed)

private struct Controls: View {
    let state: WorkoutActivityAttributes.ContentState
    let compact: Bool

    var body: some View {
        VStack(spacing: 6) {
            HStack(spacing: 4) {
                ForEach(LiveSteps.weight.filter { $0 < 0 }, id: \.self) { d in
                    stepButton(Fmt.step(d), intent: AdjustWeightIntent(delta: d))
                }
                Text(state.nextWeight == "BW" ? "BW" : (state.nextWeight.isEmpty ? "— lbs" : "\(state.nextWeight) lbs"))
                    .font(.system(size: compact ? 13 : 15, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .contentTransition(.numericText(value: Fmt.value(state.nextWeight)))
                    .lineLimit(1).minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity)
                ForEach(LiveSteps.weight.filter { $0 > 0 }, id: \.self) { d in
                    stepButton(Fmt.step(d), intent: AdjustWeightIntent(delta: d))
                }
            }
            HStack(spacing: 6) {
                stepButton("−1", intent: AdjustRepsIntent(delta: -1))
                Text("\(state.nextReps.isEmpty ? "—" : state.nextReps) reps")
                    .font(.system(size: compact ? 13 : 15, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .contentTransition(.numericText(value: Fmt.value(state.nextReps)))
                    .lineLimit(1).minimumScaleFactor(0.7)
                    .frame(minWidth: 48)
                stepButton("+1", intent: AdjustRepsIntent(delta: 1))
                // Big Add Set button: fills the rest of the row so it's easy to hit mid-workout.
                Button(intent: AddSetIntent()) {
                    HStack(spacing: 6) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: compact ? 20 : 24, weight: .black))
                        Text("ADD SET")
                            .font(.system(size: compact ? 18 : 22, weight: .black, design: .rounded))
                            .lineLimit(1).minimumScaleFactor(0.7)
                    }
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: compact ? 44 : 48)
                    .background(C.green, in: RoundedRectangle(cornerRadius: 14))
                    .contentShape(RoundedRectangle(cornerRadius: 14))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func stepButton(_ label: String, intent: some AppIntent) -> some View {
        Button(intent: intent) {
            Text(label)
                .font(.system(size: compact ? 11 : 12, weight: .bold, design: .rounded))
                .foregroundStyle(C.green)
                .frame(minWidth: compact ? 34 : 38, minHeight: compact ? 28 : 30)
                .background(C.button, in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}
