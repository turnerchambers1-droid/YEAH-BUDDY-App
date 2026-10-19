package com.turnerchambers.yeahbuddy.data

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonPrimitive
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.math.roundToLong

// Same JSON shapes as the iOS app's data.json (which kept the web app's Firestore shapes).
// Every field has a default, so a file saved by an older build — or by the iPhone — always loads.

/** Swift encodes UUIDs as uppercase strings; keep that so files round-trip. */
fun newId(): String = UUID.randomUUID().toString().uppercase()

fun nowMs(): Long = System.currentTimeMillis()

/** Dates are milliseconds since 1970 (iOS `.millisecondsSince1970`); may arrive as a fraction. */
object MillisSerializer : KSerializer<Long> {
    override val descriptor = PrimitiveSerialDescriptor("Millis", PrimitiveKind.LONG)
    override fun serialize(encoder: Encoder, value: Long) = encoder.encodeLong(value)
    override fun deserialize(decoder: Decoder): Long {
        if (decoder is JsonDecoder) {
            val p = decoder.decodeJsonElement().jsonPrimitive
            return (p.doubleOrNull ?: p.content.toDoubleOrNull() ?: 0.0).roundToLong()
        }
        return decoder.decodeDouble().roundToLong()
    }
}

@Serializable
data class LoggedSet(
    val id: String = newId(),
    /** A number ("135", "42.5") or "BW". */
    val weight: String = "",
    val reps: String = "",
) {
    val weightValue: Double get() = if (weight == "BW") 0.0 else (weight.toDoubleOrNull() ?: 0.0)
    val repsValue: Int get() = reps.toIntOrNull() ?: 0
}

@Serializable
data class LoggedExercise(
    val id: String = newId(),
    val name: String = "Exercise",
    val sets: List<LoggedSet> = emptyList(),
    val readyToMoveUp: Boolean = false,
    /** Session note: written during this workout, shown until a newer one replaces it. */
    val notes: String = "",
    val goalWeight: String = "",
    val goalReps: String = "",
    val equipment: String? = null,
) {
    /** Heaviest set (ties go to the later set), matching the web's reduce. */
    val topSet: LoggedSet?
        get() {
            var best = sets.firstOrNull() ?: return null
            for (s in sets) if (s.weightValue >= best.weightValue) best = s
            return best
        }
}

@Serializable
data class Workout(
    val id: String = newId(),
    val split: String = "custom",
    val name: String? = null,
    @Serializable(with = MillisSerializer::class) val startTime: Long = nowMs(),
    @Serializable(with = MillisSerializer::class) val endTime: Long? = null,
    /** yyyy-MM-dd, set when the workout is finished. */
    val date: String = "",
    val notes: String = "",
    val exercises: List<LoggedExercise> = emptyList(),
    @Serializable(with = MillisSerializer::class) val archivedAt: Long? = null,
    @Serializable(with = MillisSerializer::class) val deletedAt: Long? = null,
) {
    val title: String get() = name ?: ExerciseCatalog.splitLabel(split)
    val durationMinutes: Int?
        get() = endTime?.let { Math.round((it - startTime) / 60000.0).toInt() }
    val totalSets: Int get() = exercises.sumOf { it.sets.size }
}

@Serializable
data class HomeTile(
    val id: String = newId(),
    val name: String = "",
    val exercises: List<String> = emptyList(),
)

@Serializable
data class ExerciseDef(
    val name: String = "Exercise",
    val split: String = "ChestBi",
    val muscleGroup: String = "Other",
    val primaryMuscles: List<String> = emptyList(),
    val secondaryMuscles: List<String> = emptyList(),
    val equipment: String? = null,
    val custom: Boolean = false,
)

/** One entry in an exercise's session history (port of getExerciseHistory). */
data class ExerciseHistoryEntry(
    val workoutId: String,
    val date: String,
    val maxWeight: Double,
    val totalVolume: Double,
    val sets: List<LoggedSet>,
    val hasBW: Boolean,
    val readyToMoveUp: Boolean,
    val notes: String,
)

/** A past session note for the notes-history sheet. */
data class SessionNoteEntry(
    val workoutId: String,
    val date: String,
    val workoutTitle: String,
    val text: String,
    val isCurrent: Boolean,
)

@Serializable
data class AppData(
    val workouts: List<Workout> = emptyList(),          // completed, newest first
    val activeWorkout: Workout? = null,
    val archivedWorkouts: List<Workout> = emptyList(),
    val recentlyDeleted: List<Workout> = emptyList(),
    val customExercises: List<ExerciseDef> = emptyList(),
    val homeTiles: List<HomeTile> = emptyList(),
    /** Permanent per-exercise setup notes ("seat 3, pin 4th from top"). */
    val setupNotes: Map<String, String> = emptyMap(),
    /** Equipment picked for an exercise; applies to every future workout. */
    val equipmentOverrides: Map<String, String> = emptyMap(),
    val userName: String = "",
    // Rest timer — persisted so it survives the app being killed.
    val restDuration: Int = 60,
    @Serializable(with = MillisSerializer::class) val restStart: Long? = null,
    @Serializable(with = MillisSerializer::class) val restEnd: Long? = null,
    val restPausedRemaining: Int? = null,
    // Workout notification ("Live Activity") state.
    val currentExercise: String? = null,
    val nextWeight: String = "",
    val nextReps: String = "",
)

val AppJson = Json {
    ignoreUnknownKeys = true
    coerceInputValues = true
    explicitNulls = false
    encodeDefaults = true
    isLenient = true
}

object Ymd {
    private fun fmt() = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    fun format(ms: Long): String = fmt().format(Date(ms))
    fun parse(s: String): Long? = try { fmt().apply { isLenient = false }.parse(s)?.time } catch (_: Exception) { null }
}
