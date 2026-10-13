import ActivityKit
import AppIntents
import Foundation

// Shared between the app and the Live Activity extension.

struct WorkoutActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var exerciseName: String
        /// Sets logged so far for the current exercise.
        var setCount: Int
        /// Last logged set for the current exercise (read-only on the card).
        var lastWeight: String
        var lastReps: String
        /// Values the +/- buttons adjust; "Add Set" logs these.
        var nextWeight: String
        var nextReps: String
        var restStart: Date?
        var restEnd: Date?
        /// The latest set beat this exercise's all-time best weight.
        var isPR: Bool = false
    }

    var workoutName: String
    var workoutStart: Date
}

/// Weight/rep step values offered on the Live Activity (taken from the web app's chips).
enum LiveSteps {
    static let weight: [Double] = [-10, -5, -2.5, 2.5, 5, 10]
    static let reps: [Int] = [-1, 1]
}

enum Fmt {
    /// "BW", "135 lbs", or "—".
    static func weight(_ w: String) -> String {
        if w == "BW" { return "BW" }
        return w.isEmpty ? "—" : "\(w) lbs"
    }

    static func number(_ d: Double) -> String {
        d == d.rounded() ? String(Int(d)) : String(format: "%g", d)
    }

    static func value(_ w: String) -> Double { Double(w) ?? 0 }

    static func step(_ d: Double) -> String {
        (d > 0 ? "+" : "−") + number(abs(d))
    }
}

// MARK: - Live Activity buttons (iOS 17+). These run inside the app's process.

struct AdjustWeightIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Adjust next set weight"
    static var isDiscoverable = false

    @Parameter(title: "Change") var delta: Double

    init() {}
    init(delta: Double) { self.delta = delta }

    func perform() async throws -> some IntentResult {
        #if !WIDGET_EXTENSION
        await Store.shared.liveAdjustWeight(by: delta)
        #endif
        return .result()
    }
}

struct AdjustRepsIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Adjust next set reps"
    static var isDiscoverable = false

    @Parameter(title: "Change") var delta: Int

    init() {}
    init(delta: Int) { self.delta = delta }

    func perform() async throws -> some IntentResult {
        #if !WIDGET_EXTENSION
        await Store.shared.liveAdjustReps(by: delta)
        #endif
        return .result()
    }
}

struct AddSetIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Add set"
    static var isDiscoverable = false

    init() {}

    func perform() async throws -> some IntentResult {
        #if !WIDGET_EXTENSION
        await Store.shared.liveAddSet()
        #endif
        return .result()
    }
}
