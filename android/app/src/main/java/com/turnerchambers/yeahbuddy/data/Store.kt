package com.turnerchambers.yeahbuddy.data

import android.content.Context
import android.os.VibrationEffect
import android.os.VibratorManager
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.turnerchambers.yeahbuddy.service.RestNotifications
import com.turnerchambers.yeahbuddy.service.WorkoutService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import kotlin.math.ceil
import kotlin.math.max

enum class AppTab { Workout, Library, Progress, Profile }

/**
 * App state, persisted as one JSON file on the device (port of the iOS Store).
 * The file lives in filesDir/YeahBuddy/data.json, survives app updates and is
 * included in Android Auto Backup (Google account).
 */
object Store {
    private lateinit var app: Context
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private var _data by mutableStateOf(AppData())
    var data: AppData
        get() = _data
        set(value) {
            if (value == _data) return
            _data = value
            didChange()
        }

    // UI-only state (not persisted)
    var selectedTab by mutableStateOf(AppTab.Workout)
    /** Set when a notification tap should reveal an exercise. */
    var focusRequest by mutableStateOf<String?>(null)
    /** When the rest timer last hit zero while the app was open (drives the "DONE" flash). */
    var restFinishedAt by mutableStateOf<Long?>(null)
    /** A just-finished custom workout to offer saving as a home tile. */
    var pendingTilePrompt by mutableStateOf<Workout?>(null)
    var appVisible = false
    /** Rest ended and no new rest started yet — the notification shows "LIFT!". */
    private var restEndedAt: Long? = null
    fun restFinishedRecently(): Boolean = data.restEnd == null && restEndedAt != null

    private var saveJob: Job? = null
    private var syncJob: Job? = null
    private var restJob: Job? = null

    fun init(context: Context) {
        if (::app.isInitialized) return
        app = context.applicationContext
        _data = load()
        purgeOldDeleted()
        scheduleRestFinish()
    }

    // region Persistence

    private val directory: File
        get() = File(app.filesDir, "YeahBuddy").apply { mkdirs() }
    private val fileUrl get() = File(directory, "data.json")
    private val backupUrl get() = File(directory, "data-previous.json")

    fun encode(d: AppData = data): String = AppJson.encodeToString(AppData.serializer(), d)
    fun decode(text: String): AppData = AppJson.decodeFromString(AppData.serializer(), text)

    private fun load(): AppData {
        val file = fileUrl
        if (!file.exists()) return AppData()
        try {
            val decoded = decode(file.readText())
            // Keep a copy of the last file that loaded cleanly.
            file.copyTo(backupUrl, overwrite = true)
            return decoded
        } catch (_: Exception) {
        }
        // Never overwrite a file we couldn't read: set it aside and fall back to the backup.
        val stamp = System.currentTimeMillis() / 1000
        file.renameTo(File(directory, "data-unreadable-$stamp.json"))
        return try { decode(backupUrl.readText()) } catch (_: Exception) { AppData() }
    }

    fun saveNow() {
        saveJob?.cancel()
        if (!::app.isInitialized) return
        try {
            val tmp = File(directory, "data.json.tmp")
            tmp.writeText(encode())
            if (!tmp.renameTo(fileUrl)) {
                fileUrl.writeText(tmp.readText()); tmp.delete()
            }
        } catch (_: Exception) {
        }
    }

    private fun didChange() {
        saveJob?.cancel()
        saveJob = scope.launch { delay(400); saveNow() }
        syncJob?.cancel()
        syncJob = scope.launch { delay(300); syncNotification() }
    }

    fun syncNotification() {
        syncJob?.cancel()
        if (::app.isInitialized) WorkoutService.sync(app)
    }

    /** Writes a timestamped copy of the current data (used before an import replaces it). */
    fun snapshot(label: String) {
        try { File(directory, "data-before-$label-${System.currentTimeMillis() / 1000}.json").writeText(encode()) } catch (_: Exception) {}
    }

    private inline fun mutate(body: (AppData) -> AppData) { data = body(data) }

    private inline fun mutateActive(crossinline body: (Workout) -> Workout) {
        val w = data.activeWorkout ?: return
        data = data.copy(activeWorkout = body(w))
    }

    private inline fun mutateExercise(name: String, crossinline body: (LoggedExercise) -> LoggedExercise) {
        mutateActive { w -> w.copy(exercises = w.exercises.map { if (it.name == name) body(it) else it }) }
    }

    private fun purgeOldDeleted() {
        val cutoff = nowMs() - 3L * 24 * 60 * 60 * 1000
        val kept = data.recentlyDeleted.filter { (it.deletedAt ?: 0) > cutoff }
        if (kept.size != data.recentlyDeleted.size) data = data.copy(recentlyDeleted = kept)
    }

    // endregion
    // region Active workout

    fun startWorkout(split: String, name: String? = null, exercises: List<String> = emptyList()) {
        val w = Workout(split = split, name = name, exercises = exercises.distinct().map { LoggedExercise(name = it) })
        mutate { d ->
            d.copy(activeWorkout = w, currentExercise = w.exercises.firstOrNull()?.name,
                restStart = null, restEnd = null, restPausedRemaining = null)
        }
        refreshNextSet()
        syncNotification()
    }

    fun addExercise(name: String) {
        val w = data.activeWorkout ?: return
        if (w.exercises.any { it.name == name }) return
        mutate { d -> d.copy(activeWorkout = w.copy(exercises = w.exercises + LoggedExercise(name = name)), currentExercise = name) }
        refreshNextSet()
    }

    fun removeExercise(name: String) {
        mutate { d ->
            val w = d.activeWorkout?.let { it.copy(exercises = it.exercises.filter { e -> e.name != name }) }
            d.copy(activeWorkout = w,
                currentExercise = if (d.currentExercise == name) w?.exercises?.lastOrNull()?.name else d.currentExercise)
        }
        refreshNextSet()
    }

    /**
     * Port of ExerciseCard.handleAddSet: copy the previous set, or for the first set
     * use last session's final weight with the best reps hit at that weight (else 15).
     */
    fun addSet(name: String) {
        val ex = data.activeWorkout?.exercises?.firstOrNull { it.name == name } ?: return
        val (weight, reps) = defaultNewSet(ex)
        appendSet(LoggedSet(weight = weight, reps = reps), name)
    }

    private fun appendSet(set: LoggedSet, name: String) {
        mutate { d ->
            val w = d.activeWorkout ?: return@mutate d
            if (w.exercises.none { it.name == name }) return@mutate d
            d.copy(
                activeWorkout = w.copy(exercises = w.exercises.map { if (it.name == name) it.copy(sets = it.sets + set) else it }),
                currentExercise = name, nextWeight = set.weight, nextReps = set.reps,
            )
        }
        startRest()
    }

    private fun defaultNewSet(ex: LoggedExercise): Pair<String, String> {
        val goalReps = "15"
        ex.sets.lastOrNull()?.let { return it.weight to it.reps.ifEmpty { goalReps } }
        val lastSession = history(ex.name).lastOrNull() ?: return "" to goalReps
        val lastSet = lastSession.sets.lastOrNull() ?: return "" to goalReps
        val best = lastSession.sets.filter { it.weight == lastSet.weight }.maxOfOrNull { it.repsValue } ?: lastSet.repsValue
        return lastSet.weight to (if (best > 0) best.toString() else goalReps)
    }

    fun updateSet(name: String, setId: String, weight: String? = null, reps: String? = null) {
        mutate { d ->
            val w = d.activeWorkout ?: return@mutate d
            val ex = w.exercises.firstOrNull { it.name == name } ?: return@mutate d
            if (ex.sets.none { it.id == setId }) return@mutate d
            val newSets = ex.sets.map { s -> if (s.id == setId) s.copy(weight = weight ?: s.weight, reps = reps ?: s.reps) else s }
            val newEx = ex.copy(sets = newSets)
            var nd = d.copy(activeWorkout = w.copy(exercises = w.exercises.map { if (it.name == name) newEx else it }))
            // Editing the latest set re-seeds the notification's "next set".
            if (newSets.last().id == setId) {
                val s = newSets.last()
                nd = nd.copy(currentExercise = name, nextWeight = s.weight, nextReps = s.reps)
            }
            nd
        }
    }

    fun removeSet(name: String, setId: String) {
        mutateExercise(name) { ex -> ex.copy(sets = ex.sets.filter { it.id != setId }) }
        if (data.currentExercise == name) refreshNextSet()
    }

    fun toggleReadyToMoveUp(name: String) = mutateExercise(name) { it.copy(readyToMoveUp = !it.readyToMoveUp) }
    fun updateNotes(name: String, notes: String) = mutateExercise(name) { it.copy(notes = notes) }
    fun updateGoal(name: String, weight: String? = null, reps: String? = null) =
        mutateExercise(name) { it.copy(goalWeight = weight ?: it.goalWeight, goalReps = reps ?: it.goalReps) }

    /** Sets (or clears) an exercise's equipment for this and all future workouts. */
    fun setEquipment(name: String, equipment: String?) {
        mutate { d ->
            val overrides = if (equipment != null) d.equipmentOverrides + (name to equipment) else d.equipmentOverrides - name
            val w = d.activeWorkout?.let { w -> w.copy(exercises = w.exercises.map { if (it.name == name) it.copy(equipment = equipment) else it }) }
            d.copy(equipmentOverrides = overrides, activeWorkout = w)
        }
    }

    /** The equipment option chosen for an exercise (override, else the custom exercise's own value). */
    fun equipmentChoice(name: String): String? =
        data.equipmentOverrides[name] ?: ExerciseCatalog.find(name, data.customExercises)?.equipment

    /** Short tag shown on badges and used by the picker's equipment filter. */
    fun equipmentTag(name: String): String? = ExerciseCatalog.inferEquipment(name, equipmentChoice(name))

    fun updateWorkoutNotes(notes: String) = mutateActive { it.copy(notes = notes) }

    fun updateActiveWorkoutName(name: String?) {
        val trimmed = name?.trim()
        mutateActive { it.copy(name = if (trimmed.isNullOrEmpty()) null else trimmed) }
    }

    /** Renaming to an unknown name creates a custom exercise so it shows up next time. */
    fun renameExercise(oldName: String, newName: String) {
        val trimmed = newName.trim()
        val w = data.activeWorkout ?: return
        if (trimmed.isEmpty() || trimmed == oldName || w.exercises.any { it.name == trimmed }) return
        mutate { d ->
            val aw = d.activeWorkout ?: return@mutate d
            if (aw.exercises.none { it.name == oldName }) return@mutate d
            var nd = d.copy(activeWorkout = aw.copy(exercises = aw.exercises.map { if (it.name == oldName) it.copy(name = trimmed) else it }))
            if (nd.currentExercise == oldName) nd = nd.copy(currentExercise = trimmed)
            d.setupNotes[oldName]?.let { if (d.setupNotes[trimmed] == null) nd = nd.copy(setupNotes = nd.setupNotes + (trimmed to it)) }
            d.equipmentOverrides[oldName]?.let { if (d.equipmentOverrides[trimmed] == null) nd = nd.copy(equipmentOverrides = nd.equipmentOverrides + (trimmed to it)) }
            if (ExerciseCatalog.find(trimmed, d.customExercises) == null) {
                val split = aw.split
                val entry = (ExerciseCatalog.find(oldName, d.customExercises)
                    ?: ExerciseDef(name = trimmed, split = if (split != "custom") split else "ChestBi", muscleGroup = "Other"))
                    .copy(name = trimmed, custom = true)
                nd = nd.copy(customExercises = nd.customExercises + entry)
            }
            nd
        }
    }

    fun setCurrentExercise(name: String) {
        if (data.currentExercise == name) return
        data = data.copy(currentExercise = name)
        refreshNextSet()
    }

    /** Re-seed the notification's next set from the current exercise. */
    private fun refreshNextSet() {
        val name = data.currentExercise ?: return
        val ex = data.activeWorkout?.exercises?.firstOrNull { it.name == name } ?: return
        val (w, r) = ex.sets.lastOrNull()?.let { it.weight to it.reps } ?: defaultNewSet(ex)
        if (data.nextWeight != w || data.nextReps != r) data = data.copy(nextWeight = w, nextReps = r)
    }

    fun finishWorkout(): Workout? {
        val active = data.activeWorkout ?: return null
        val w = active.copy(endTime = nowMs(), date = Ymd.format(nowMs()))
        mutate { d -> d.copy(workouts = listOf(w) + d.workouts, activeWorkout = null, currentExercise = null) }
        resetRest()
        saveNow()
        syncNotification()
        return w
    }

    fun discardWorkout() {
        mutate { d -> d.copy(activeWorkout = null, currentExercise = null) }
        resetRest()
        syncNotification()
    }

    // endregion
    // region Past workouts

    fun softDelete(id: String) {
        mutate { d ->
            val w = d.workouts.firstOrNull { it.id == id } ?: return@mutate d
            d.copy(workouts = d.workouts.filter { it.id != id }, recentlyDeleted = listOf(w.copy(deletedAt = nowMs())) + d.recentlyDeleted)
        }
    }

    fun restoreDeleted(id: String) {
        mutate { d ->
            val w = d.recentlyDeleted.firstOrNull { it.id == id } ?: return@mutate d
            d.copy(recentlyDeleted = d.recentlyDeleted.filter { it.id != id },
                workouts = (d.workouts + w.copy(deletedAt = null)).sortedByDescending { it.startTime })
        }
    }

    fun permanentlyDelete(id: String) {
        data = data.copy(recentlyDeleted = data.recentlyDeleted.filter { it.id != id })
    }

    fun archive(id: String) {
        mutate { d ->
            val w = d.workouts.firstOrNull { it.id == id } ?: return@mutate d
            d.copy(workouts = d.workouts.filter { it.id != id }, archivedWorkouts = listOf(w.copy(archivedAt = nowMs())) + d.archivedWorkouts)
        }
    }

    fun unarchive(id: String) {
        mutate { d ->
            val w = d.archivedWorkouts.firstOrNull { it.id == id } ?: return@mutate d
            d.copy(archivedWorkouts = d.archivedWorkouts.filter { it.id != id },
                workouts = (d.workouts + w.copy(archivedAt = null)).sortedByDescending { it.startTime })
        }
    }

    fun updateWorkout(updated: Workout) {
        mutate { d -> d.copy(workouts = d.workouts.map { if (it.id == updated.id) updated else it }) }
    }

    private fun workoutKey(w: Workout) = "${w.date}|${w.name ?: ""}|${w.exercises.joinToString(",") { it.name }}"

    private fun unknownExercisesAsCustom(d: AppData, names: Collection<String>): List<ExerciseDef> {
        val out = d.customExercises.toMutableList()
        for (name in names.toSet()) {
            if (ExerciseCatalog.find(name, out) == null) {
                out.add(ExerciseDef(name = name, split = "ChestBi", muscleGroup = "Other", custom = true))
            }
        }
        return out
    }

    /** Adds workouts that aren't already present (matched by date + name + exercises). */
    fun importWorkouts(incoming: List<Workout>): Int {
        val existing = data.workouts.map(::workoutKey).toSet()
        val fresh = incoming.filter { workoutKey(it) !in existing }
        if (fresh.isEmpty()) return 0
        mutate { d ->
            // Exercise names we don't know yet become custom exercises.
            d.copy(
                workouts = (d.workouts + fresh).sortedByDescending { it.startTime },
                customExercises = unknownExercisesAsCustom(d, fresh.flatMap { w -> w.exercises.map { it.name } }),
            )
        }
        saveNow()
        return fresh.size
    }

    /** Replaces everything with an imported data.json (from the iPhone or an Android export). */
    fun replaceAll(imported: AppData) {
        snapshot("import")
        resetRest()
        data = imported.copy(restStart = null, restEnd = null, restPausedRemaining = null)
        purgeOldDeleted()
        saveNow()
        syncNotification()
    }

    /** Merges an imported data.json: adds workouts / exercises / notes that aren't here yet. */
    fun mergeAll(imported: AppData): Int {
        snapshot("merge")
        val d = data
        val ids = (d.workouts + d.archivedWorkouts + d.recentlyDeleted).map { it.id }.toSet()
        val keys = d.workouts.map(::workoutKey).toSet()
        val freshWorkouts = imported.workouts.filter { it.id !in ids && workoutKey(it) !in keys }
        val freshArchived = imported.archivedWorkouts.filter { it.id !in ids }
        val custom = d.customExercises + imported.customExercises.filter { c -> d.customExercises.none { it.name == c.name } }
        var nd = d.copy(
            workouts = (d.workouts + freshWorkouts).sortedByDescending { it.startTime },
            archivedWorkouts = (d.archivedWorkouts + freshArchived).sortedByDescending { it.archivedAt ?: it.startTime },
            customExercises = custom,
            homeTiles = d.homeTiles + imported.homeTiles.filter { t -> d.homeTiles.none { it.name == t.name } },
            setupNotes = imported.setupNotes + d.setupNotes,
            equipmentOverrides = imported.equipmentOverrides + d.equipmentOverrides,
            userName = d.userName.ifEmpty { imported.userName },
        )
        nd = nd.copy(customExercises = unknownExercisesAsCustom(nd, freshWorkouts.flatMap { w -> w.exercises.map { it.name } }))
        data = nd
        saveNow()
        return freshWorkouts.size
    }

    // endregion
    // region Home tiles, custom exercises, setup notes

    fun saveHomeTile(name: String, exercises: List<String>) {
        mutate { d -> d.copy(homeTiles = d.homeTiles.filter { it.name != name } + HomeTile(name = name, exercises = exercises)) }
    }

    fun deleteHomeTile(id: String) { data = data.copy(homeTiles = data.homeTiles.filter { it.id != id }) }

    fun addCustomExercise(ex: ExerciseDef) {
        val e = ex.copy(custom = true)
        mutate { d -> d.copy(customExercises = d.customExercises.filter { it.name != e.name } + e) }
    }

    val allExercises: List<ExerciseDef> get() = ExerciseCatalog.builtIn + data.customExercises

    fun setupNote(name: String): String = data.setupNotes[name] ?: ""

    fun setSetupNote(text: String, name: String) {
        data = if (text.isBlank()) data.copy(setupNotes = data.setupNotes - name)
        else data.copy(setupNotes = data.setupNotes + (name to text))
    }

    fun setUserName(name: String) { data = data.copy(userName = name) }

    // endregion
    // region History

    /** Oldest → newest, like the web's getExerciseHistory. */
    fun history(name: String, d: AppData = data): List<ExerciseHistoryEntry> =
        d.workouts.asReversed().mapNotNull { w ->
            val ex = w.exercises.firstOrNull { it.name == name } ?: return@mapNotNull null
            ExerciseHistoryEntry(
                workoutId = w.id,
                date = w.date,
                maxWeight = max(0.0, ex.sets.maxOfOrNull { it.weightValue } ?: 0.0),
                totalVolume = ex.sets.sumOf { it.repsValue * it.weightValue },
                sets = ex.sets,
                hasBW = ex.sets.any { it.weight == "BW" },
                readyToMoveUp = ex.readyToMoveUp,
                notes = ex.notes,
            )
        }

    fun personalRecord(name: String): Double {
        var best = 0.0
        for (w in data.workouts) {
            val ex = w.exercises.firstOrNull { it.name == name } ?: continue
            for (s in ex.sets) if (s.weightValue > best) best = s.weightValue
        }
        return best
    }

    /** Every session note for an exercise, newest first (the active workout's note first). */
    fun sessionNotes(name: String): List<SessionNoteEntry> {
        val out = mutableListOf<SessionNoteEntry>()
        data.activeWorkout?.let { w ->
            val ex = w.exercises.firstOrNull { it.name == name }
            if (ex != null && ex.notes.isNotBlank()) out.add(SessionNoteEntry(w.id, "Today", w.title, ex.notes, true))
        }
        for (w in data.workouts) {
            val ex = w.exercises.firstOrNull { it.name == name } ?: continue
            if (ex.notes.isNotBlank()) out.add(SessionNoteEntry(w.id, w.date, w.title, ex.notes, false))
        }
        return out
    }

    /** The most recent note from a finished workout — stays visible until replaced. */
    fun latestPreviousNote(name: String): SessionNoteEntry? = sessionNotes(name).firstOrNull { !it.isCurrent }

    // endregion
    // region Rest timer

    val restRunning: Boolean get() = data.restEnd != null

    fun restRemaining(now: Long = nowMs()): Int {
        data.restEnd?.let { return max(0, ceil((it - now) / 1000.0).toInt()) }
        data.restPausedRemaining?.let { return it }
        return if (restFinishedAt != null) 0 else data.restDuration
    }

    fun startRest() {
        val now = nowMs()
        restFinishedAt = null
        restEndedAt = null
        mutate { d -> d.copy(restStart = now, restEnd = now + d.restDuration * 1000L, restPausedRemaining = null) }
        RestNotifications.schedule(app, data.restEnd!!, data.restDuration)
        scheduleRestFinish()
        syncNotification()
    }

    fun toggleRest() {
        val end = data.restEnd
        if (end != null) {
            val remaining = max(0, ceil((end - nowMs()) / 1000.0).toInt())
            mutate { d -> d.copy(restEnd = null, restStart = null, restPausedRemaining = remaining) }
            RestNotifications.cancel(app)
            restJob?.cancel()
        } else {
            val paused = data.restPausedRemaining ?: 0
            val remaining = if (paused > 0) paused else data.restDuration
            val now = nowMs()
            restFinishedAt = null
            restEndedAt = null
            mutate { d ->
                d.copy(restStart = now - (d.restDuration - remaining) * 1000L, restEnd = now + remaining * 1000L, restPausedRemaining = null)
            }
            RestNotifications.schedule(app, data.restEnd!!, data.restDuration)
            scheduleRestFinish()
        }
        syncNotification()
    }

    fun resetRest() {
        restJob?.cancel()
        if (::app.isInitialized) RestNotifications.cancel(app)
        restFinishedAt = null
        restEndedAt = null
        mutate { d -> d.copy(restEnd = null, restStart = null, restPausedRemaining = null) }
    }

    fun selectRestPreset(seconds: Int) {
        data = data.copy(restDuration = seconds)
        resetRest()
    }

    private fun scheduleRestFinish() {
        restJob?.cancel()
        val end = data.restEnd ?: return
        restJob = scope.launch {
            val wait = end - nowMs()
            if (wait > 0) delay(wait)
            finishRest()
        }
    }

    /** Called when the countdown reaches zero (in-app timer or the alarm), and on returning to the app. */
    fun finishRest() {
        val end = data.restEnd ?: return
        if (end > nowMs()) return
        val wasRecent = nowMs() - end < 5000
        restEndedAt = end
        mutate { d -> d.copy(restEnd = null, restStart = null, restPausedRemaining = null) }
        if (wasRecent && appVisible) {
            // App is open: the notification plays the sound; add a strong haptic.
            restFinishedAt = nowMs()
            vibrateDone()
        }
        syncNotification()
    }

    private fun vibrateDone() {
        try {
            val vm = app.getSystemService(VibratorManager::class.java)
            vm?.defaultVibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 180, 270, 180), -1))
        } catch (_: Exception) {}
    }

    // endregion
    // region Workout notification

    data class LiveState(
        val workoutName: String,
        val workoutStart: Long,
        val exerciseName: String,
        val setCount: Int,
        val lastWeight: String,
        val lastReps: String,
        val nextWeight: String,
        val nextReps: String,
        val restStart: Long?,
        val restEnd: Long?,
        val isPR: Boolean,
        val lift: Boolean,
    )

    fun liveState(): LiveState? {
        val w = data.activeWorkout ?: return null
        val ex = w.exercises.firstOrNull { it.name == data.currentExercise } ?: w.exercises.lastOrNull()
        val last = ex?.sets?.lastOrNull()
        var isPR = false
        if (ex != null && last != null && last.weightValue > 0) {
            val best = personalRecord(ex.name)
            val maxNow = ex.sets.maxOf { it.weightValue }
            isPR = last.weightValue > best && last.weightValue >= maxNow
        }
        return LiveState(
            workoutName = w.title, workoutStart = w.startTime,
            exerciseName = ex?.name ?: "Add an exercise",
            setCount = ex?.sets?.size ?: 0,
            lastWeight = last?.weight ?: "", lastReps = last?.reps ?: "",
            nextWeight = data.nextWeight, nextReps = data.nextReps,
            restStart = data.restStart, restEnd = data.restEnd, isPR = isPR,
            lift = restFinishedRecently(),
        )
    }

    fun liveAdjustWeight(delta: Double) {
        val current = if (data.nextWeight == "BW") 0.0 else (data.nextWeight.toDoubleOrNull() ?: 0.0)
        data = data.copy(nextWeight = Fmt.number(max(0.0, current + delta)))
        saveNow()
        syncNotification()
    }

    fun liveAdjustReps(delta: Int) {
        data = data.copy(nextReps = max(0, (data.nextReps.toIntOrNull() ?: 0) + delta).toString())
        saveNow()
        syncNotification()
    }

    fun liveAddSet() {
        val name = data.currentExercise ?: data.activeWorkout?.exercises?.lastOrNull()?.name ?: return
        appendSet(LoggedSet(weight = data.nextWeight, reps = data.nextReps), name)
        saveNow()
        syncNotification()
    }

    /** Tapping the workout notification or the rest alert opens the current exercise. */
    fun openCurrentExercise() {
        selectedTab = AppTab.Workout
        focusRequest = data.currentExercise
    }

    fun appDidBecomeActive() {
        appVisible = true
        purgeOldDeleted()
        finishRest()
        scheduleRestFinish()
        syncNotification()
    }

    fun appDidEnterBackground() {
        appVisible = false
        saveNow()
    }

    // endregion
}
