import Foundation
import Observation
import UIKit

/// App state, persisted as one JSON file on the device (replaces the web app's
/// Firestore store). The file lives in Application Support, so it survives app
/// updates and is included in the phone's iCloud/computer backups.
@Observable
@MainActor
final class Store {
    static let shared = Store()

    var data: AppData { didSet { didChange() } }

    // UI-only state (not persisted)
    var selectedTab: AppTab = .workout
    /// Set when a Live Activity / notification tap should reveal an exercise.
    var focusRequest: String? = nil
    /// When the rest timer last hit zero while the app was open (drives the "DONE" flash).
    var restFinishedAt: Date? = nil
    /// A just-finished custom workout to offer saving as a home tile.
    var pendingTilePrompt: Workout? = nil

    @ObservationIgnored private var saveTask: Task<Void, Never>?
    @ObservationIgnored private var activityTask: Task<Void, Never>?
    @ObservationIgnored private var restTask: Task<Void, Never>?

    private init() {
        data = Store.load()
        purgeOldDeleted()
        scheduleRestFinish()
    }

    // MARK: - Persistence

    private static var directory: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("YeahBuddy", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }
    private static var fileURL: URL { directory.appendingPathComponent("data.json") }
    private static var backupURL: URL { directory.appendingPathComponent("data-previous.json") }

    private static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .millisecondsSince1970
        return e
    }()
    private static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .millisecondsSince1970
        return d
    }()

    private static func load() -> AppData {
        let fm = FileManager.default
        guard fm.fileExists(atPath: fileURL.path) else { return AppData() }
        if let raw = try? Data(contentsOf: fileURL), let decoded = try? decoder.decode(AppData.self, from: raw) {
            // Keep a copy of the last file that loaded cleanly.
            try? fm.removeItem(at: backupURL)
            try? fm.copyItem(at: fileURL, to: backupURL)
            return decoded
        }
        // Never overwrite a file we couldn't read: set it aside and fall back to the backup.
        let stamp = Int(Date().timeIntervalSince1970)
        try? fm.moveItem(at: fileURL, to: directory.appendingPathComponent("data-unreadable-\(stamp).json"))
        if let raw = try? Data(contentsOf: backupURL), let decoded = try? decoder.decode(AppData.self, from: raw) {
            return decoded
        }
        return AppData()
    }

    func saveNow() {
        saveTask?.cancel()
        guard let raw = try? Store.encoder.encode(data) else { return }
        try? raw.write(to: Store.fileURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    private func didChange() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(400))
            guard !Task.isCancelled else { return }
            self?.saveNow()
        }
        activityTask?.cancel()
        activityTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled, let self else { return }
            await LiveActivityManager.shared.sync(self)
        }
    }

    /// Batch several mutations into one change notification.
    private func mutate(_ body: (inout AppData) -> Void) {
        var copy = data
        body(&copy)
        data = copy
    }

    private func mutateActive(_ body: (inout Workout) -> Void) {
        guard data.activeWorkout != nil else { return }
        mutate { d in body(&d.activeWorkout!) }
    }

    private func mutateExercise(_ name: String, _ body: (inout LoggedExercise) -> Void) {
        mutateActive { w in
            if let i = w.exercises.firstIndex(where: { $0.name == name }) { body(&w.exercises[i]) }
        }
    }

    private func purgeOldDeleted() {
        let cutoff = Date().addingTimeInterval(-3 * 24 * 60 * 60)
        let kept = data.recentlyDeleted.filter { ($0.deletedAt ?? .distantPast) > cutoff }
        if kept.count != data.recentlyDeleted.count { data.recentlyDeleted = kept }
    }

    // MARK: - Active workout

    func startWorkout(split: String, name: String? = nil, exercises: [String] = []) {
        var w = Workout(split: split, name: name)
        var seen = Set<String>()
        w.exercises = exercises.filter { seen.insert($0).inserted }.map { LoggedExercise(name: $0) }
        mutate { d in
            d.activeWorkout = w
            d.currentExercise = w.exercises.first?.name
            d.restStart = nil; d.restEnd = nil; d.restPausedRemaining = nil
        }
        refreshNextSet()
        RestNotifications.requestAuthorization()
    }

    func addExercise(_ name: String) {
        guard let w = data.activeWorkout, !w.exercises.contains(where: { $0.name == name }) else { return }
        mutate { d in
            d.activeWorkout!.exercises.append(LoggedExercise(name: name))
            d.currentExercise = name
        }
        refreshNextSet()
    }

    func removeExercise(_ name: String) {
        mutate { d in
            d.activeWorkout?.exercises.removeAll { $0.name == name }
            if d.currentExercise == name { d.currentExercise = d.activeWorkout?.exercises.last?.name }
        }
        refreshNextSet()
    }

    /// Port of ExerciseCard.handleAddSet: copy the previous set, or for the first set
    /// use last session's final weight with the best reps hit at that weight (else 15).
    func addSet(to name: String) {
        guard let ex = data.activeWorkout?.exercises.first(where: { $0.name == name }) else { return }
        let (weight, reps) = defaultNewSet(for: ex)
        appendSet(LoggedSet(weight: weight, reps: reps), to: name)
    }

    private func appendSet(_ set: LoggedSet, to name: String) {
        mutate { d in
            guard let i = d.activeWorkout?.exercises.firstIndex(where: { $0.name == name }) else { return }
            d.activeWorkout!.exercises[i].sets.append(set)
            d.currentExercise = name
            d.nextWeight = set.weight
            d.nextReps = set.reps
        }
        startRest()
    }

    private func defaultNewSet(for ex: LoggedExercise) -> (String, String) {
        let goalReps = "15"
        if let last = ex.sets.last {
            return (last.weight, last.reps.isEmpty ? goalReps : last.reps)
        }
        guard let lastSession = history(for: ex.name).last, let lastSet = lastSession.sets.last else {
            return ("", goalReps)
        }
        let repsAtWeight = lastSession.sets.filter { $0.weight == lastSet.weight }.map(\.repsValue)
        let best = repsAtWeight.max() ?? lastSet.repsValue
        return (lastSet.weight, best > 0 ? String(best) : goalReps)
    }

    func updateSet(exercise name: String, setID: UUID, weight: String? = nil, reps: String? = nil) {
        mutate { d in
            guard let i = d.activeWorkout?.exercises.firstIndex(where: { $0.name == name }),
                  let j = d.activeWorkout!.exercises[i].sets.firstIndex(where: { $0.id == setID }) else { return }
            if let weight { d.activeWorkout!.exercises[i].sets[j].weight = weight }
            if let reps { d.activeWorkout!.exercises[i].sets[j].reps = reps }
            // Editing the latest set re-seeds the Live Activity's "next set".
            let ex = d.activeWorkout!.exercises[i]
            if ex.sets.last?.id == setID {
                d.currentExercise = name
                d.nextWeight = ex.sets[j].weight
                d.nextReps = ex.sets[j].reps
            }
        }
    }

    func removeSet(exercise name: String, setID: UUID) {
        mutateExercise(name) { $0.sets.removeAll { $0.id == setID } }
        if data.currentExercise == name { refreshNextSet() }
    }

    func toggleReadyToMoveUp(_ name: String) { mutateExercise(name) { $0.readyToMoveUp.toggle() } }
    func updateNotes(_ name: String, _ notes: String) { mutateExercise(name) { $0.notes = notes } }
    /// Sets (or clears) an exercise's equipment for this and all future workouts.
    func setEquipment(_ name: String, _ equipment: String?) {
        mutate { d in
            if let equipment { d.equipmentOverrides[name] = equipment } else { d.equipmentOverrides.removeValue(forKey: name) }
            if let i = d.activeWorkout?.exercises.firstIndex(where: { $0.name == name }) {
                d.activeWorkout!.exercises[i].equipment = equipment
            }
        }
    }

    /// The equipment option chosen for an exercise (override, else the custom exercise's own value).
    func equipmentChoice(for name: String) -> String? {
        data.equipmentOverrides[name] ?? ExerciseCatalog.find(name, custom: data.customExercises)?.equipment
    }

    /// Short tag shown on badges and used by the picker's equipment filter.
    func equipmentTag(for name: String) -> String? {
        ExerciseCatalog.inferEquipment(name: name, equipment: equipmentChoice(for: name))
    }
    func updateWorkoutNotes(_ notes: String) { mutateActive { $0.notes = notes } }
    func updateActiveWorkoutName(_ name: String?) {
        let trimmed = name?.trimmingCharacters(in: .whitespaces)
        mutateActive { $0.name = (trimmed?.isEmpty ?? true) ? nil : trimmed }
    }

    /// Renaming to an unknown name creates a custom exercise so it shows up next time.
    func renameExercise(_ oldName: String, to newName: String) {
        let trimmed = newName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, trimmed != oldName,
              data.activeWorkout?.exercises.contains(where: { $0.name == trimmed }) == false else { return }
        mutate { d in
            guard let i = d.activeWorkout?.exercises.firstIndex(where: { $0.name == oldName }) else { return }
            d.activeWorkout!.exercises[i].name = trimmed
            if d.currentExercise == oldName { d.currentExercise = trimmed }
            if let note = d.setupNotes[oldName], d.setupNotes[trimmed] == nil { d.setupNotes[trimmed] = note }
            if let eq = d.equipmentOverrides[oldName], d.equipmentOverrides[trimmed] == nil { d.equipmentOverrides[trimmed] = eq }
            if ExerciseCatalog.find(trimmed, custom: d.customExercises) == nil {
                let split = d.activeWorkout!.split
                var entry = ExerciseCatalog.find(oldName, custom: d.customExercises)
                    ?? ExerciseDef(name: trimmed, split: split != "custom" ? split : "ChestBi", muscleGroup: "Other", primaryMuscles: [], secondaryMuscles: [])
                entry.name = trimmed
                entry.custom = true
                d.customExercises.append(entry)
            }
        }
    }

    func setCurrentExercise(_ name: String) {
        guard data.currentExercise != name else { return }
        data.currentExercise = name
        refreshNextSet()
    }

    /// Re-seed the Live Activity's next set from the current exercise.
    private func refreshNextSet() {
        guard let name = data.currentExercise,
              let ex = data.activeWorkout?.exercises.first(where: { $0.name == name }) else { return }
        let (w, r) = ex.sets.last.map { ($0.weight, $0.reps) } ?? defaultNewSet(for: ex)
        if data.nextWeight != w || data.nextReps != r {
            mutate { d in d.nextWeight = w; d.nextReps = r }
        }
    }

    @discardableResult
    func finishWorkout() -> Workout? {
        guard var w = data.activeWorkout else { return nil }
        w.endTime = Date()
        w.date = DateFormatter.ymd.string(from: Date())
        mutate { d in
            d.workouts.insert(w, at: 0)
            d.activeWorkout = nil
            d.currentExercise = nil
        }
        resetRest()
        saveNow()
        return w
    }

    func discardWorkout() {
        mutate { d in d.activeWorkout = nil; d.currentExercise = nil }
        resetRest()
    }

    // MARK: - Past workouts

    func softDelete(_ id: UUID) {
        mutate { d in
            guard let i = d.workouts.firstIndex(where: { $0.id == id }) else { return }
            var w = d.workouts.remove(at: i)
            w.deletedAt = Date()
            d.recentlyDeleted.insert(w, at: 0)
        }
    }

    func restoreDeleted(_ id: UUID) {
        mutate { d in
            guard let i = d.recentlyDeleted.firstIndex(where: { $0.id == id }) else { return }
            var w = d.recentlyDeleted.remove(at: i)
            w.deletedAt = nil
            d.workouts.append(w)
            d.workouts.sort { $0.startTime > $1.startTime }
        }
    }

    func permanentlyDelete(_ id: UUID) {
        data.recentlyDeleted.removeAll { $0.id == id }
    }

    func archive(_ id: UUID) {
        mutate { d in
            guard let i = d.workouts.firstIndex(where: { $0.id == id }) else { return }
            var w = d.workouts.remove(at: i)
            w.archivedAt = Date()
            d.archivedWorkouts.insert(w, at: 0)
        }
    }

    func unarchive(_ id: UUID) {
        mutate { d in
            guard let i = d.archivedWorkouts.firstIndex(where: { $0.id == id }) else { return }
            var w = d.archivedWorkouts.remove(at: i)
            w.archivedAt = nil
            d.workouts.append(w)
            d.workouts.sort { $0.startTime > $1.startTime }
        }
    }

    func updateWorkout(_ updated: Workout) {
        mutate { d in
            if let i = d.workouts.firstIndex(where: { $0.id == updated.id }) { d.workouts[i] = updated }
        }
    }

    /// Adds workouts that aren't already present (matched by date + name + exercises).
    @discardableResult
    func importWorkouts(_ incoming: [Workout]) -> Int {
        func key(_ w: Workout) -> String { "\(w.date)|\(w.name ?? "")|\(w.exercises.map(\.name).joined(separator: ","))" }
        let existing = Set(data.workouts.map(key))
        let fresh = incoming.filter { !existing.contains(key($0)) }
        guard !fresh.isEmpty else { return 0 }
        mutate { d in
            d.workouts.append(contentsOf: fresh)
            d.workouts.sort { $0.startTime > $1.startTime }
            // Exercise names we don't know yet become custom exercises.
            for w in fresh {
                for name in w.exercises.map(\.name) where ExerciseCatalog.find(name, custom: d.customExercises) == nil {
                    let split = ExerciseCatalog.splits.contains(w.split) ? w.split : "ChestBi"
                    d.customExercises.append(ExerciseDef(name: name, split: split, muscleGroup: "Other", primaryMuscles: [], secondaryMuscles: [], custom: true))
                }
            }
        }
        saveNow()
        return fresh.count
    }

    // MARK: - Home tiles, custom exercises, setup notes

    func saveHomeTile(name: String, exercises: [String]) {
        mutate { d in
            d.homeTiles.removeAll { $0.name == name }
            d.homeTiles.append(HomeTile(name: name, exercises: exercises))
        }
    }

    func deleteHomeTile(_ id: UUID) { data.homeTiles.removeAll { $0.id == id } }

    func addCustomExercise(_ ex: ExerciseDef) {
        var ex = ex
        ex.custom = true
        mutate { d in
            d.customExercises.removeAll { $0.name == ex.name }
            d.customExercises.append(ex)
        }
    }

    var allExercises: [ExerciseDef] { ExerciseCatalog.builtIn + data.customExercises }

    func setupNote(for name: String) -> String { data.setupNotes[name] ?? "" }

    func setSetupNote(_ text: String, for name: String) {
        if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            data.setupNotes.removeValue(forKey: name)
        } else {
            data.setupNotes[name] = text
        }
    }

    // MARK: - History

    /// Oldest → newest, like the web's getExerciseHistory.
    func history(for name: String) -> [ExerciseHistoryEntry] {
        data.workouts.reversed().compactMap { w in
            guard let ex = w.exercises.first(where: { $0.name == name }) else { return nil }
            return ExerciseHistoryEntry(
                workoutID: w.id,
                date: w.date,
                maxWeight: ex.sets.map(\.weightValue).max().map { max(0, $0) } ?? 0,
                totalVolume: ex.sets.reduce(0) { $0 + Double($1.repsValue) * $1.weightValue },
                sets: ex.sets,
                hasBW: ex.sets.contains { $0.weight == "BW" },
                readyToMoveUp: ex.readyToMoveUp,
                notes: ex.notes
            )
        }
    }

    func personalRecord(for name: String) -> Double {
        history(for: name).map(\.maxWeight).max() ?? 0
    }

    /// Every session note for an exercise, newest first (the active workout's note first).
    func sessionNotes(for name: String) -> [SessionNoteEntry] {
        var out: [SessionNoteEntry] = []
        if let w = data.activeWorkout, let ex = w.exercises.first(where: { $0.name == name }),
           !ex.notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            out.append(SessionNoteEntry(workoutID: w.id, date: "Today", workoutTitle: w.title, text: ex.notes, isCurrent: true))
        }
        for w in data.workouts {
            if let ex = w.exercises.first(where: { $0.name == name }),
               !ex.notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                out.append(SessionNoteEntry(workoutID: w.id, date: w.date, workoutTitle: w.title, text: ex.notes, isCurrent: false))
            }
        }
        return out
    }

    /// The most recent note from a finished workout — stays visible until replaced.
    func latestPreviousNote(for name: String) -> SessionNoteEntry? {
        sessionNotes(for: name).first { !$0.isCurrent }
    }

    // MARK: - Rest timer

    var restRunning: Bool { data.restEnd != nil }

    func restRemaining(at now: Date = Date()) -> Int {
        if let end = data.restEnd { return max(0, Int(ceil(end.timeIntervalSince(now)))) }
        if let paused = data.restPausedRemaining { return paused }
        return restFinishedAt != nil ? 0 : data.restDuration
    }

    func startRest() {
        let now = Date()
        restFinishedAt = nil
        mutate { d in
            d.restStart = now
            d.restEnd = now.addingTimeInterval(TimeInterval(d.restDuration))
            d.restPausedRemaining = nil
        }
        RestNotifications.schedule(at: data.restEnd!, duration: data.restDuration)
        scheduleRestFinish()
    }

    func toggleRest() {
        RestNotifications.requestAuthorization()
        if let end = data.restEnd {
            let remaining = max(0, Int(ceil(end.timeIntervalSinceNow)))
            mutate { d in d.restEnd = nil; d.restStart = nil; d.restPausedRemaining = remaining }
            RestNotifications.cancel()
            restTask?.cancel()
        } else {
            let remaining = (data.restPausedRemaining ?? 0) > 0 ? data.restPausedRemaining! : data.restDuration
            let now = Date()
            restFinishedAt = nil
            mutate { d in
                d.restStart = now.addingTimeInterval(-TimeInterval(d.restDuration - remaining))
                d.restEnd = now.addingTimeInterval(TimeInterval(remaining))
                d.restPausedRemaining = nil
            }
            RestNotifications.schedule(at: data.restEnd!, duration: data.restDuration)
            scheduleRestFinish()
        }
    }

    func resetRest() {
        restTask?.cancel()
        RestNotifications.cancel()
        restFinishedAt = nil
        mutate { d in d.restEnd = nil; d.restStart = nil; d.restPausedRemaining = nil }
    }

    func selectRestPreset(_ seconds: Int) {
        data.restDuration = seconds
        resetRest()
    }

    private func scheduleRestFinish() {
        restTask?.cancel()
        guard let end = data.restEnd else { return }
        restTask = Task { [weak self] in
            let wait = end.timeIntervalSinceNow
            if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
            guard !Task.isCancelled else { return }
            self?.finishRest()
        }
    }

    /// Called when the countdown reaches zero, and on returning to the foreground.
    func finishRest() {
        guard let end = data.restEnd, end <= Date() else { return }
        let wasRecent = Date().timeIntervalSince(end) < 5
        mutate { d in d.restEnd = nil; d.restStart = nil; d.restPausedRemaining = nil }
        if wasRecent {
            // App is open: the notification banner plays the sound; add a strong haptic.
            restFinishedAt = Date()
            let gen = UINotificationFeedbackGenerator()
            gen.notificationOccurred(.warning)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { gen.notificationOccurred(.warning) }
        }
    }

    // MARK: - Live Activity

    func activityState() -> WorkoutActivityAttributes.ContentState? {
        guard let w = data.activeWorkout else { return nil }
        let ex = w.exercises.first { $0.name == data.currentExercise } ?? w.exercises.last
        let last = ex?.sets.last
        var isPR = false
        if let ex, let last, last.weightValue > 0 {
            let best = personalRecord(for: ex.name)
            let maxNow = ex.sets.map(\.weightValue).max() ?? 0
            isPR = last.weightValue > best && last.weightValue >= maxNow
        }
        return .init(
            exerciseName: ex?.name ?? "Add an exercise",
            setCount: ex?.sets.count ?? 0,
            lastWeight: last?.weight ?? "",
            lastReps: last?.reps ?? "",
            nextWeight: data.nextWeight,
            nextReps: data.nextReps,
            restStart: data.restStart,
            restEnd: data.restEnd,
            isPR: isPR
        )
    }

    func liveAdjustWeight(by delta: Double) async {
        let current = data.nextWeight == "BW" ? 0 : (Double(data.nextWeight) ?? 0)
        data.nextWeight = Fmt.number(max(0, current + delta))
        saveNow()
        await LiveActivityManager.shared.sync(self)
    }

    func liveAdjustReps(by delta: Int) async {
        data.nextReps = String(max(0, (Int(data.nextReps) ?? 0) + delta))
        saveNow()
        await LiveActivityManager.shared.sync(self)
    }

    func liveAddSet() async {
        guard let name = data.currentExercise ?? data.activeWorkout?.exercises.last?.name else { return }
        appendSet(LoggedSet(weight: data.nextWeight, reps: data.nextReps), to: name)
        saveNow()
        await LiveActivityManager.shared.sync(self)
    }

    /// Tapping the Live Activity or the rest alert opens the current exercise.
    func openCurrentExercise() {
        selectedTab = .workout
        focusRequest = data.currentExercise
    }

    func appDidBecomeActive() {
        purgeOldDeleted()
        finishRest()
        scheduleRestFinish()
        Task { await LiveActivityManager.shared.sync(self) }
    }
}

enum AppTab: Hashable {
    case workout, library, progress, profile
}
