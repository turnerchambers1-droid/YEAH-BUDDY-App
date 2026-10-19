package com.turnerchambers.yeahbuddy.ui

import android.app.DatePickerDialog
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.StickyNote2
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.ExerciseCatalog
import com.turnerchambers.yeahbuddy.data.ExerciseHistoryEntry
import com.turnerchambers.yeahbuddy.data.LoggedExercise
import com.turnerchambers.yeahbuddy.data.LoggedSet
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.data.Workout
import com.turnerchambers.yeahbuddy.data.Ymd
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.Calendar

// region Custom workout (Build First / Build As You Go)

@Composable
fun CustomWorkoutSheet(onDismiss: () -> Unit, onStart: (String?, List<String>) -> Unit) {
    var buildFirst by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var exercises by remember { mutableStateOf(listOf<String>()) }
    var showSelector by remember { mutableStateOf(false) }

    Sheet(
        title = if (buildFirst) "Custom Workout" else "",
        onDismiss = onDismiss,
        onClose = { if (buildFirst) buildFirst = false else onDismiss() },
        confirmLabel = if (buildFirst) "Start" else null,
        confirmEnabled = name.isNotBlank(),
        onConfirm = { onStart(name.trim(), exercises); onDismiss() },
    ) {
        if (!buildFirst) {
            Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)) {
                Column(Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Custom Workout", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("How do you want to build it?", fontSize = 15.sp, color = Theme.muted)
                }
                Choice("Build First", "Add all exercises, then start", primary = true) { buildFirst = true }
                Choice("Build As You Go", "Start immediately, add exercises mid-session", primary = false) { onStart(null, emptyList()); onDismiss() }
            }
        } else {
            Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                SectionLabel("Workout Name")
                YBField(name, { name = it }, "e.g. \"Pull Day\", \"Leg Blast\"", Modifier.fillMaxWidth().card(radius = 12.dp).padding(horizontal = 16.dp, vertical = 12.dp))
                SectionLabel("Exercises (${exercises.size})")
                if (exercises.isNotEmpty()) {
                    Column(Modifier.fillMaxWidth().card()) {
                        exercises.forEach { ex ->
                            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(ex, fontSize = 15.sp, color = Color.White, modifier = Modifier.weight(1f))
                                Icon(Icons.Filled.Close, "Remove", tint = Theme.muted, modifier = Modifier.size(18.dp).plainClick { exercises = exercises - ex })
                            }
                            HorizontalDivider(color = Theme.border)
                        }
                    }
                }
                AddExerciseButton { showSelector = true }
            }
        }
    }
    if (showSelector) {
        ExerciseSelector(exercises, null, onDismiss = { showSelector = false }) { exercises = exercises + it }
    }
}

@Composable
private fun Choice(title: String, sub: String, primary: Boolean, onClick: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().card(if (primary) Theme.green else Theme.raised)
            .border(1.dp, if (primary) Color.Transparent else Theme.field, RoundedCornerShape(16.dp))
            .pressable(onClick).padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (primary) Color.Black else Color.White)
        Text(sub, fontSize = 12.sp, color = if (primary) Color.Black.copy(alpha = 0.7f) else Theme.muted)
    }
}

// endregion
// region Edit a finished workout

@Composable
fun EditWorkoutSheet(original: Workout, onDismiss: () -> Unit, onSave: (Workout) -> Unit) {
    val context = LocalContext.current
    var workout by remember { mutableStateOf(original) }
    var name by remember { mutableStateOf(original.name ?: "") }
    var date by remember { mutableStateOf(original.date.ifEmpty { Ymd.format(original.startTime) }) }
    var durationMins by remember { mutableStateOf(original.durationMinutes?.toString() ?: "") }
    var showSelector by remember { mutableStateOf(false) }

    Sheet("Edit Workout", onDismiss, confirmLabel = "Save", onConfirm = {
        val trimmed = name.trim()
        var w = workout.copy(name = trimmed.ifEmpty { null }, date = date)
        val mins = durationMins.toIntOrNull()
        if (mins != null && mins > 0) w = w.copy(endTime = w.startTime + mins * 60_000L)
        onSave(w)
        onDismiss()
    }) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            SectionLabel("Workout Name")
            YBField(name, { name = it }, "Push Day, Leg Blast…", Modifier.fillMaxWidth().card(radius = 12.dp).padding(horizontal = 16.dp, vertical = 12.dp))

            SectionLabel("Date")
            Text(date, fontSize = 16.sp, color = Theme.green,
                modifier = Modifier.fillMaxWidth().card(radius = 12.dp).plainClick {
                    val c = Calendar.getInstance().apply { timeInMillis = Ymd.parse(date) ?: workout.startTime }
                    DatePickerDialog(context, android.R.style.Theme_Material_Dialog, { _, y, m, d ->
                        date = "%04d-%02d-%02d".format(y, m + 1, d)
                    }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show()
                }.padding(horizontal = 16.dp, vertical = 12.dp))

            SectionLabel("Duration (minutes)")
            YBField(durationMins, { durationMins = it }, "e.g. 45", Modifier.fillMaxWidth().card(radius = 12.dp).padding(horizontal = 16.dp, vertical = 12.dp),
                keyboard = KeyboardOptions(keyboardType = KeyboardType.Number))

            SectionLabel("Workout Type")
            (ExerciseCatalog.splits + "custom").chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { key ->
                        val on = workout.split == key
                        Text(ExerciseCatalog.splitLabel(key), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = if (on) Theme.green else Theme.soft,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.weight(1f).card(if (on) Theme.green.copy(alpha = 0.13f) else Theme.card, 12.dp)
                                .border(1.dp, if (on) Theme.green.copy(alpha = 0.27f) else Theme.border, RoundedCornerShape(12.dp))
                                .plainClick { workout = workout.copy(split = key) }.padding(vertical = 12.dp))
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }

            SectionLabel("Exercises")
            workout.exercises.forEach { ex ->
                androidx.compose.runtime.key(ex.id) {
                    EditExerciseBlock(ex, onChange = { updated -> workout = workout.copy(exercises = workout.exercises.map { if (it.id == ex.id) updated else it }) }) {
                        workout = workout.copy(exercises = workout.exercises.filter { it.id != ex.id })
                    }
                }
            }
            AddExerciseButton { showSelector = true }
        }
    }
    if (showSelector) {
        ExerciseSelector(workout.exercises.map { it.name }, workout.split, onDismiss = { showSelector = false }) { n ->
            workout = workout.copy(exercises = workout.exercises + LoggedExercise(name = n, sets = listOf(LoggedSet())))
        }
    }
}

@Composable
private fun EditExerciseBlock(exercise: LoggedExercise, onChange: (LoggedExercise) -> Unit, onRemove: () -> Unit) {
    Column(Modifier.fillMaxWidth().card()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            YBField(exercise.name, { onChange(exercise.copy(name = it)) }, "Exercise", Modifier.weight(1f), fontSize = 14.sp, weight = FontWeight.SemiBold)
            Icon(Icons.Filled.Close, "Remove", tint = Theme.red, modifier = Modifier.size(20.dp).plainClick(onClick = onRemove))
        }
        HorizontalDivider(color = Theme.border)
        Column(Modifier.padding(horizontal = 16.dp, vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            exercise.sets.forEachIndexed { i, set ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("${i + 1}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.muted, modifier = Modifier.width(20.dp), textAlign = TextAlign.Center)
                    YBField(set.weight, { v -> onChange(exercise.copy(sets = exercise.sets.map { if (it.id == set.id) it.copy(weight = v) else it })) }, "lbs",
                        Modifier.weight(1f).card(Theme.field, 8.dp).padding(vertical = 8.dp), weight = FontWeight.SemiBold, center = true,
                        keyboard = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                    YBField(set.reps, { v -> onChange(exercise.copy(sets = exercise.sets.map { if (it.id == set.id) it.copy(reps = v) else it })) }, "reps",
                        Modifier.weight(1f).card(Theme.field, 8.dp).padding(vertical = 8.dp), weight = FontWeight.SemiBold, center = true,
                        keyboard = KeyboardOptions(keyboardType = KeyboardType.Number))
                    Icon(Icons.Filled.Delete, "Delete set", tint = Theme.muted,
                        modifier = Modifier.size(18.dp).plainClick { onChange(exercise.copy(sets = exercise.sets.filter { it.id != set.id })) })
                }
            }
            Row(
                Modifier.fillMaxWidth().card(Theme.raised, 12.dp).plainClick {
                    val last = exercise.sets.lastOrNull()
                    onChange(exercise.copy(sets = exercise.sets + LoggedSet(weight = last?.weight ?: "", reps = last?.reps ?: "")))
                }.padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Filled.Add, null, tint = Theme.green, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Add Set", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Theme.green)
            }
            YBField(exercise.notes, { onChange(exercise.copy(notes = it)) }, "Session note…",
                Modifier.padding(top = 4.dp).fillMaxWidth().card(Theme.card2, 12.dp).border(1.dp, Theme.field, RoundedCornerShape(12.dp)).padding(10.dp),
                textColor = Color(0xFFAAAAAA), fontSize = 14.sp, singleLine = false, minLines = 2, maxLines = 5)
        }
    }
}

// endregion
// region Last 3 sessions for an exercise

@Composable
fun LastSessionsSheet(name: String, sessions: List<ExerciseHistoryEntry>, onDismiss: () -> Unit) {
    Sheet(name, onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            sessions.forEachIndexed { i, session ->
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(if (i == 0) "Most Recent" else if (i == 1) "2 sessions ago" else "3 sessions ago", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.green)
                        Text("· ${session.date}", fontSize = 12.sp, color = Theme.muted)
                    }
                    Row {
                        Text("SET", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Theme.muted, modifier = Modifier.width(32.dp))
                        Text("WEIGHT", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Theme.muted, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                        Text("REPS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Theme.muted, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                    }
                    HorizontalDivider(color = Theme.field)
                    session.sets.forEachIndexed { j, s ->
                        Row {
                            Text("${j + 1}", fontSize = 12.sp, fontFamily = FontFamily.Monospace, color = Theme.muted, modifier = Modifier.width(32.dp))
                            Text(if (s.weight.isEmpty()) "—" else if (s.weight == "BW") "BW" else "${s.weight} lbs", fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold, color = Theme.text, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                            Text(s.reps.ifEmpty { "—" }, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Theme.text,
                                modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                        }
                    }
                    if (session.notes.isNotEmpty()) Text(session.notes, fontSize = 12.sp, color = Theme.soft, modifier = Modifier.padding(top = 2.dp))
                }
            }
        }
    }
}

// endregion
// region Session note history

@Composable
fun NotesHistorySheet(name: String, onDismiss: () -> Unit) {
    val notes = Store.sessionNotes(name)
    Sheet("$name notes", onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            val setup = Store.setupNote(name)
            if (setup.isNotEmpty()) {
                Column(Modifier.fillMaxWidth().card(Theme.card2, 12.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconLabel(Icons.Filled.Build, "SETUP", Theme.gold, 10.sp, FontWeight.Bold, 11.dp)
                    Text(setup, fontSize = 14.sp, color = Theme.gold.copy(alpha = 0.9f))
                }
            }
            if (notes.isEmpty()) EmptyState(Icons.AutoMirrored.Filled.StickyNote2, "No session notes yet")
            notes.forEach { n ->
                Column(Modifier.fillMaxWidth().card(radius = 12.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(n.date, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (n.isCurrent) Theme.green else Theme.soft)
                        Text("· ${n.workoutTitle}", fontSize = 12.sp, color = Theme.muted)
                    }
                    Text(n.text, fontSize = 14.sp, color = Theme.text)
                }
            }
        }
    }
}

// endregion
// region Exercise image thumbnails (wger.de lookup, same as the web / iOS)

object WgerImages {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val inflight = ConcurrentHashMap<String, Deferred<String?>>()
    private val bitmaps = LruCache<String, Bitmap>(60)
    private val json = Json { ignoreUnknownKeys = true }

    private fun get(url: String): String {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 8000; conn.readTimeout = 8000
        return conn.inputStream.use { it.readBytes().decodeToString() }
    }

    suspend fun url(name: String): String? = inflight.getOrPut(name) { scope.async { fetchUrl(name) } }.await()

    private fun fetchUrl(name: String): String? {
        return try {
                val term = URLEncoder.encode(name.split(" ").take(3).joinToString(" "), "UTF-8")
                val search = json.parseToJsonElement(get("https://wger.de/api/v2/exercise/search/?term=$term&language=english&format=json")).jsonObject
                val id = search["suggestions"]?.jsonArray?.firstOrNull()?.jsonObject?.get("data")?.jsonObject?.get("id")?.jsonPrimitive?.intOrNull
                    ?: return null
                val imgs = json.parseToJsonElement(get("https://wger.de/api/v2/exerciseimage/?exercise_base=$id&format=json")).jsonObject
                imgs["results"]?.jsonArray?.firstOrNull()?.jsonObject?.get("image")?.jsonPrimitive?.contentOrNull
            } catch (_: Exception) { null }
    }

    suspend fun bitmap(url: String): Bitmap? {
        bitmaps.get(url)?.let { return it }
        val bmp = withContext(Dispatchers.IO) {
            try {
                val conn = URL(url).openConnection() as HttpURLConnection
                conn.connectTimeout = 8000; conn.readTimeout = 8000
                val bytes = conn.inputStream.use { it.readBytes() }
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
                var sample = 1
                while (bounds.outWidth / sample > 600) sample *= 2
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size, BitmapFactory.Options().apply { inSampleSize = sample })
            } catch (_: Exception) { null }
        }
        if (bmp != null) bitmaps.put(url, bmp)
        return bmp
    }
}

@Composable
fun rememberWgerImage(name: String): ImageBitmap? {
    var image by remember(name) { mutableStateOf<ImageBitmap?>(null) }
    LaunchedEffect(name) {
        val url = WgerImages.url(name) ?: return@LaunchedEffect
        image = WgerImages.bitmap(url)?.asImageBitmap()
    }
    return image
}

@Composable
fun ExerciseThumb(name: String, size: Dp = 36.dp) {
    val image = rememberWgerImage(name)
    Box(Modifier.size(size).clip(RoundedCornerShape(8.dp)).card(Theme.field, 8.dp), contentAlignment = Alignment.Center) {
        if (image != null) Image(image, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
        else Icon(Icons.Filled.FitnessCenter, null, tint = Theme.muted, modifier = Modifier.size(size * 0.4f))
    }
}

// endregion
