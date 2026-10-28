import ActivityKit
import Foundation

/// Runs one Live Activity for the whole workout: started once, updated in place, ended on finish.
@MainActor
final class LiveActivityManager {
    static let shared = LiveActivityManager()

    private var lastState: WorkoutActivityAttributes.ContentState?

    func sync(_ store: Store) async {
        guard let workout = store.data.activeWorkout, let state = store.activityState() else {
            await endAll()
            return
        }
        // Going stale when rest ends lets the widget flip to "LIFT!" with the app suspended.
        let content = ActivityContent(state: state, staleDate: state.restEnd)

        // A stale activity is still the live one (it goes stale every time a rest ends), so
        // count it. Missing that used to start a second activity on top of the old "LIFT!" one.
        let live = Activity<WorkoutActivityAttributes>.activities.filter {
            $0.activityState == .active || $0.activityState == .stale
        }
        let mine = live.first { abs($0.attributes.workoutStart.timeIntervalSince(workout.startTime)) < 1 }
        for other in live where other.id != mine?.id {
            await other.end(nil, dismissalPolicy: .immediate)
        }

        if let activity = mine {
            guard state != lastState || activity.activityState == .stale else { return }
            let newPR = state.isPR && (state.setCount != lastState?.setCount || lastState?.isPR != true)
            lastState = state
            if newPR {
                // Lights up / expands the Dynamic Island with a sound.
                await activity.update(content, alertConfiguration: AlertConfiguration(
                    title: "NEW PR! 🏆",
                    body: "\(state.exerciseName) — \(Fmt.weight(state.lastWeight)) × \(state.lastReps)",
                    sound: .default))
            } else {
                await activity.update(content)
            }
            return
        }

        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        do {
            _ = try Activity.request(
                attributes: WorkoutActivityAttributes(workoutName: workout.title, workoutStart: workout.startTime),
                content: content,
                pushType: nil
            )
            lastState = state
        } catch {
            // Requests only succeed while the app is in the foreground; the next sync retries.
        }
    }

    func endAll() async {
        lastState = nil
        for activity in Activity<WorkoutActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
}
