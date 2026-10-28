import Foundation

// Same shapes as the web app's Firestore documents. Every field decodes with a
// default so data saved by an older build always loads in a newer one.

struct LoggedSet: Codable, Hashable, Identifiable {
    var id = UUID()
    /// A number ("135", "42.5") or "BW".
    var weight: String = ""
    var reps: String = ""

    init(id: UUID = UUID(), weight: String = "", reps: String = "") {
        self.id = id; self.weight = weight; self.reps = reps
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decodeIfPresent(UUID.self, forKey: .id) ?? UUID()
        weight = try c.decodeIfPresent(String.self, forKey: .weight) ?? ""
        reps = try c.decodeIfPresent(String.self, forKey: .reps) ?? ""
    }

    var weightValue: Double { weight == "BW" ? 0 : (Double(weight) ?? 0) }
    var repsValue: Int { Int(reps) ?? 0 }
}

struct LoggedExercise: Codable, Hashable, Identifiable {
    var id = UUID()
    var name: String
    var sets: [LoggedSet] = []
    var readyToMoveUp = false
    /// Session note: written during this workout, shown until a newer one replaces it.
    var notes = ""
    var equipment: String? = nil

    init(name: String) { self.name = name }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decodeIfPresent(UUID.self, forKey: .id) ?? UUID()
        name = try c.decodeIfPresent(String.self, forKey: .name) ?? "Exercise"
        sets = try c.decodeIfPresent([LoggedSet].self, forKey: .sets) ?? []
        readyToMoveUp = try c.decodeIfPresent(Bool.self, forKey: .readyToMoveUp) ?? false
        notes = try c.decodeIfPresent(String.self, forKey: .notes) ?? ""
        equipment = try c.decodeIfPresent(String.self, forKey: .equipment)
    }

    /// Heaviest set (ties go to the later set), matching the web's reduce.
    var topSet: LoggedSet? {
        guard var best = sets.first else { return nil }
        for s in sets where s.weightValue >= best.weightValue { best = s }
        return best
    }
}

struct Workout: Codable, Hashable, Identifiable {
    var id = UUID()
    var split: String = "custom"
    var name: String? = nil
    var startTime = Date()
    var endTime: Date? = nil
    /// yyyy-MM-dd, set when the workout is finished.
    var date: String = ""
    var notes = ""
    var exercises: [LoggedExercise] = []
    var archivedAt: Date? = nil
    var deletedAt: Date? = nil

    init(split: String, name: String?) {
        self.split = split
        self.name = name
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decodeIfPresent(UUID.self, forKey: .id) ?? UUID()
        split = try c.decodeIfPresent(String.self, forKey: .split) ?? "custom"
        name = try c.decodeIfPresent(String.self, forKey: .name)
        startTime = try c.decodeIfPresent(Date.self, forKey: .startTime) ?? Date()
        endTime = try c.decodeIfPresent(Date.self, forKey: .endTime)
        date = try c.decodeIfPresent(String.self, forKey: .date) ?? ""
        notes = try c.decodeIfPresent(String.self, forKey: .notes) ?? ""
        exercises = try c.decodeIfPresent([LoggedExercise].self, forKey: .exercises) ?? []
        archivedAt = try c.decodeIfPresent(Date.self, forKey: .archivedAt)
        deletedAt = try c.decodeIfPresent(Date.self, forKey: .deletedAt)
    }

    var title: String { name ?? ExerciseCatalog.splitLabel(split) }

    var durationMinutes: Int? {
        guard let endTime else { return nil }
        return Int((endTime.timeIntervalSince(startTime) / 60).rounded())
    }

    var totalSets: Int { exercises.reduce(0) { $0 + $1.sets.count } }
}

struct HomeTile: Codable, Hashable, Identifiable {
    var id = UUID()
    var name: String
    var exercises: [String]
}

/// One entry in an exercise's session history (port of getExerciseHistory).
struct ExerciseHistoryEntry: Hashable {
    var workoutID: UUID
    var date: String
    var maxWeight: Double
    var totalVolume: Double
    var sets: [LoggedSet]
    var hasBW: Bool
    var readyToMoveUp: Bool
    var notes: String
}

/// A past session note for the notes-history sheet.
struct SessionNoteEntry: Hashable, Identifiable {
    var id: UUID { workoutID }
    var workoutID: UUID
    var date: String
    var workoutTitle: String
    var text: String
    var isCurrent: Bool
}

struct AppData: Codable {
    var workouts: [Workout] = []          // completed, newest first
    var activeWorkout: Workout? = nil
    var archivedWorkouts: [Workout] = []
    var recentlyDeleted: [Workout] = []
    var customExercises: [ExerciseDef] = []
    var homeTiles: [HomeTile] = []
    /// Permanent per-exercise setup notes ("seat 3, pin 4th from top").
    var setupNotes: [String: String] = [:]
    /// Equipment picked for an exercise; applies to every future workout.
    var equipmentOverrides: [String: String] = [:]
    var userName = ""

    // Rest timer — persisted so it survives the app being killed.
    var restDuration = 60
    var restStart: Date? = nil
    var restEnd: Date? = nil
    var restPausedRemaining: Int? = nil

    // Live Activity state.
    var currentExercise: String? = nil
    var nextWeight = ""
    var nextReps = ""

    init() {}

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        workouts = try c.decodeIfPresent([Workout].self, forKey: .workouts) ?? []
        activeWorkout = try c.decodeIfPresent(Workout.self, forKey: .activeWorkout)
        archivedWorkouts = try c.decodeIfPresent([Workout].self, forKey: .archivedWorkouts) ?? []
        recentlyDeleted = try c.decodeIfPresent([Workout].self, forKey: .recentlyDeleted) ?? []
        customExercises = try c.decodeIfPresent([ExerciseDef].self, forKey: .customExercises) ?? []
        homeTiles = try c.decodeIfPresent([HomeTile].self, forKey: .homeTiles) ?? []
        setupNotes = try c.decodeIfPresent([String: String].self, forKey: .setupNotes) ?? [:]
        equipmentOverrides = try c.decodeIfPresent([String: String].self, forKey: .equipmentOverrides) ?? [:]
        userName = try c.decodeIfPresent(String.self, forKey: .userName) ?? ""
        restDuration = try c.decodeIfPresent(Int.self, forKey: .restDuration) ?? 60
        restStart = try c.decodeIfPresent(Date.self, forKey: .restStart)
        restEnd = try c.decodeIfPresent(Date.self, forKey: .restEnd)
        restPausedRemaining = try c.decodeIfPresent(Int.self, forKey: .restPausedRemaining)
        currentExercise = try c.decodeIfPresent(String.self, forKey: .currentExercise)
        nextWeight = try c.decodeIfPresent(String.self, forKey: .nextWeight) ?? ""
        nextReps = try c.decodeIfPresent(String.self, forKey: .nextReps) ?? ""
    }
}

extension DateFormatter {
    static let ymd: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}
