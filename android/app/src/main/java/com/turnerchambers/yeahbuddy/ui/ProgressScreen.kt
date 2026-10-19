package com.turnerchambers.yeahbuddy.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.ExerciseDef
import com.turnerchambers.yeahbuddy.data.ExerciseHistoryEntry
import com.turnerchambers.yeahbuddy.data.Fmt
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.data.Workout
import com.turnerchambers.yeahbuddy.data.Ymd
import kotlinx.coroutines.delay
import java.text.NumberFormat
import java.util.Calendar
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.log10
import kotlin.math.pow

/** Port of ProgressView.jsx (Workouts + Exercises views; the Insights dashboard was dropped). */
@Composable
fun ProgressScreen() {
    var view by rememberSaveable { mutableIntStateOf(0) }
    var search by rememberSaveable { mutableStateOf("") }
    var selected by remember { mutableStateOf<ExerciseDef?>(null) }
    val data = Store.data

    Column(Modifier.fillMaxSize()) {
        ScreenTitle("Progress")
        SearchField(search, { search = it }, if (view == 0) "Search workouts..." else "Search exercises...", Modifier.padding(horizontal = 16.dp))
        LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item { Spacer(Modifier.height(2.dp)) }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Stat(Icons.Filled.LocalFireDepartment, Theme.orange, streak(data.workouts), "day streak", Modifier.weight(1f))
                    Stat(Icons.Filled.CalendarMonth, Theme.green, data.workouts.size, "total workouts", Modifier.weight(1f))
                }
            }
            item { Segmented(listOf("Workouts", "Exercises"), view) { view = it } }

            val q = search.lowercase()
            if (view == 0) {
                val list = if (q.isEmpty()) data.workouts else data.workouts.filter { w ->
                    w.title.lowercase().contains(q) || w.exercises.any { it.name.lowercase().contains(q) }
                }
                if (list.isEmpty()) {
                    item { EmptyState(Icons.AutoMirrored.Filled.ShowChart, if (data.workouts.isEmpty()) "Log your first workout to see history here" else "No workouts found") }
                } else {
                    items(list, key = { it.id }) { SessionCard(it) }
                }
            } else {
                val items = Store.allExercises.filter { q.isEmpty() || it.name.lowercase().contains(q) }
                    .map { it to Store.history(it.name) }.filter { it.second.isNotEmpty() }
                if (items.isEmpty()) {
                    item { EmptyState(Icons.AutoMirrored.Filled.ShowChart, if (data.workouts.isEmpty()) "Log your first workout to see progress here" else "No exercises found") }
                } else {
                    items(items, key = { "e-" + it.first.name }) { (ex, history) -> ExerciseProgressRow(ex, history) { selected = ex } }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
    selected?.let { ExerciseProgressSheet(it) { selected = null } }
}

@Composable
private fun ExerciseProgressRow(ex: ExerciseDef, history: List<ExerciseHistoryEntry>, onClick: () -> Unit) {
    val pr = history.maxOf { it.maxWeight }
    val trend = if (history.size >= 2) history[history.size - 1].maxWeight - history[history.size - 2].maxWeight else null
    Row(Modifier.fillMaxWidth().card().plainClick(onClick = onClick).padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(ex.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
            val n = history.size
            Text("$n session${if (n == 1) "" else "s"} · PR: ${if (pr > 0) "${Fmt.number(pr)} lbs" else "—"}", fontSize = 12.sp, color = Theme.muted)
        }
        if (trend != null) {
            Text(if (trend > 0) "+${Fmt.number(trend)}" else if (trend == 0.0) "→" else Fmt.number(trend), fontSize = 14.sp, fontWeight = FontWeight.Bold,
                color = if (trend > 0) Theme.green else if (trend < 0) Theme.red else Theme.soft)
        }
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = Color(0xFF374151), modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun Stat(icon: ImageVector, color: Color, value: Int, label: String, modifier: Modifier) {
    Row(modifier.card().padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Icon(icon, null, tint = color, modifier = Modifier.size(26.dp))
        Column {
            Text("$value", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(label, fontSize = 12.sp, color = Color(0xFF666666))
        }
    }
}

@Composable
fun Segmented(options: List<String>, selected: Int, onSelect: (Int) -> Unit) {
    Row(Modifier.fillMaxWidth().card(Theme.raised, 9.dp).padding(2.dp)) {
        options.forEachIndexed { i, o ->
            Text(o, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = if (i == selected) Color.White else Theme.soft, textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f).card(if (i == selected) Color(0xFF3A3A3C) else Color.Transparent, 7.dp)
                    .plainClick { onSelect(i) }.padding(vertical = 6.dp))
        }
    }
}

private fun streak(workouts: List<Workout>): Int {
    val days = workouts.map { it.date }.toSet().mapNotNull { Ymd.parse(it) }.sortedDescending()
    val cal = Calendar.getInstance().apply { set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }
    var current = cal.timeInMillis
    var count = 0
    for (d in days) {
        val diff = Math.round((current - d) / 86_400_000.0)
        if (diff <= 1) { count++; current = d } else break
    }
    return count
}

@Composable
private fun SessionCard(workout: Workout) {
    var expanded by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val view = LocalView.current
    LaunchedEffect(copied) { if (copied) { delay(2000); copied = false } }

    Column(Modifier.fillMaxWidth().card()) {
        Row(Modifier.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Column(Modifier.weight(1f).plainClick { expanded = !expanded }, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(workout.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                Text("${workout.date} · ${workout.exercises.size} exercises · ${workout.totalSets} sets${workout.durationMinutes?.let { " · ${it}m" } ?: ""}",
                    fontSize = 12.sp, color = Theme.muted)
            }
            Row(
                Modifier.background(if (copied) Theme.green.copy(alpha = 0.13f) else Theme.raised, CircleShape).border(1.dp, Theme.field, CircleShape)
                    .plainClick {
                        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        cm.setPrimaryClip(ClipData.newPlainText("Workout summary", summary(workout)))
                        copied = true
                        view.performHapticFeedback(android.view.HapticFeedbackConstants.CONFIRM)
                    }
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Icon(Icons.Filled.ContentCopy, null, tint = if (copied) Theme.green else Theme.muted, modifier = Modifier.size(13.dp))
                Text(if (copied) "Copied!" else "Summary", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = if (copied) Theme.green else Theme.muted)
            }
            Icon(if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown, null, tint = Theme.dim,
                modifier = Modifier.size(18.dp).plainClick { expanded = !expanded })
        }
        AnimatedVisibility(expanded) {
            Column {
                HorizontalDivider(color = Theme.border)
                Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    workout.exercises.forEach { ExercisePreviewRow(it) }
                    if (workout.notes.isNotEmpty()) {
                        HorizontalDivider(color = Theme.border, modifier = Modifier.padding(vertical = 8.dp))
                        SectionLabel("Notes")
                        Text(workout.notes, fontSize = 14.sp, color = Theme.soft, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
        }
    }
}

/** Plain-text workout summary for sharing (same format as the web). */
private fun summary(workout: Workout): String {
    val volume = workout.exercises.sumOf { e -> e.sets.sumOf { it.repsValue * it.weightValue } }
    val sb = StringBuilder("🏋️ ${workout.name ?: workout.split} · ${workout.date}")
    workout.durationMinutes?.let { if (it > 0) sb.append(" · $it min") }
    sb.append("\n\n")
    for (ex in workout.exercises) {
        sb.append("${ex.name}\n")
        ex.sets.forEachIndexed { i, s ->
            val w = if (s.weight == "BW") "BW" else if (s.weight.isEmpty()) "" else "${s.weight} lbs"
            val r = if (s.reps.isEmpty()) "" else "${s.reps} reps"
            sb.append("  Set ${i + 1}: ${listOf(w, r).filter { it.isNotEmpty() }.joinToString(" × ")}\n")
        }
    }
    sb.append("\nTotal: ${workout.exercises.size} exercises · ${workout.totalSets} sets")
    if (volume > 0) sb.append(" · ${NumberFormat.getIntegerInstance().format(volume.toLong())} lbs volume")
    sb.append("\n\nLogged with YEAH BUDDY 💪")
    return sb.toString()
}

@Composable
fun ExerciseProgressSheet(exercise: ExerciseDef, onDismiss: () -> Unit) {
    val history = Store.history(exercise.name)
    val pr = history.maxOfOrNull { it.maxWeight } ?: 0.0
    val trend = if (history.size >= 2) history[history.size - 1].maxWeight - history[history.size - 2].maxWeight else 0.0

    Sheet(exercise.name, onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatBox("PR", if (pr > 0) Fmt.number(pr) else "—", "lbs", Color.White, Modifier.weight(1f))
                StatBox("Sessions", "${history.size}", null, Color.White, Modifier.weight(1f))
                StatBox("Last Change", if (trend > 0) "+${Fmt.number(trend)}" else if (trend == 0.0) "—" else Fmt.number(trend), "lbs",
                    if (trend > 0) Theme.green else if (trend < 0) Theme.red else Theme.soft, Modifier.weight(1f))
            }

            if (history.size >= 2) {
                Column(Modifier.fillMaxWidth().card().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Max Weight Over Time", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    LineChart(history, Modifier.fillMaxWidth().height(180.dp))
                }
            } else {
                EmptyState(Icons.AutoMirrored.Filled.ShowChart, "Log at least 2 sessions to see your progress chart", Modifier.card())
            }

            SectionLabel("Session History", Color(0xFF666666))
            Column(Modifier.fillMaxWidth().card()) {
                history.reversed().forEachIndexed { i, h ->
                    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(h.date, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color.White)
                            Text("${h.sets.size} sets", fontSize = 12.sp, color = Theme.muted)
                        }
                        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("${Fmt.number(h.maxWeight)} lbs", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("max", fontSize = 12.sp, color = Theme.muted)
                        }
                    }
                    if (i < history.size - 1) HorizontalDivider(color = Theme.border)
                }
            }
        }
    }
}

@Composable
private fun StatBox(title: String, value: String, unit: String?, color: Color, modifier: Modifier) {
    Column(modifier.card().padding(vertical = 16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(title.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF666666))
        Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = color)
        if (unit != null) Text(unit, fontSize = 12.sp, color = Theme.muted)
    }
}

/** Max weight per session: monotone line + points, MM-dd labels, light grid (Swift Charts look). */
@Composable
private fun LineChart(history: List<ExerciseHistoryEntry>, modifier: Modifier) {
    val measurer = rememberTextMeasurer()
    val labelStyle = TextStyle(fontSize = 10.sp, color = Theme.muted)
    Canvas(modifier) {
        val values = history.map { it.maxWeight }
        var lo = values.min(); var hi = values.max()
        if (hi == lo) { hi += 5; lo = maxOf(0.0, lo - 5) }
        // Nice ticks
        val rawStep = (hi - lo) / 4
        val mag = 10.0.pow(floor(log10(rawStep)))
        val step = listOf(1.0, 2.0, 2.5, 5.0, 10.0).map { it * mag }.first { it >= rawStep }
        val yMin = floor(lo / step) * step
        val yMax = ceil(hi / step) * step
        val ticks = generateSequence(yMin) { it + step }.takeWhile { it <= yMax + step / 2 }.toList()

        val yLabelW = ticks.maxOf { measurer.measure(Fmt.number(it), labelStyle).size.width }.toFloat()
        val bottomPad = 18.dp.toPx()
        val left = 4.dp.toPx(); val right = size.width - yLabelW - 6.dp.toPx()
        val top = 6.dp.toPx(); val bottom = size.height - bottomPad
        fun x(i: Int) = if (values.size == 1) (left + right) / 2 else left + (right - left) * i / (values.size - 1)
        fun y(v: Double) = (bottom - (bottom - top) * ((v - yMin) / (yMax - yMin))).toFloat()

        for (t in ticks) {
            val yy = y(t)
            drawLine(Theme.border, Offset(left, yy), Offset(right, yy), strokeWidth = 1f)
            val m = measurer.measure(Fmt.number(t), labelStyle)
            drawText(m, topLeft = Offset(right + 6.dp.toPx(), yy - m.size.height / 2f))
        }
        // Monotone cubic (Fritsch–Carlson) like .interpolationMethod(.monotone)
        val pts = values.indices.map { Offset(x(it), y(values[it])) }
        val path = Path().apply {
            moveTo(pts[0].x, pts[0].y)
            if (pts.size > 1) {
                val n = pts.size
                val d = FloatArray(n - 1) { (pts[it + 1].y - pts[it].y) / (pts[it + 1].x - pts[it].x) }
                val m = FloatArray(n)
                m[0] = d[0]; m[n - 1] = d[n - 2]
                for (i in 1 until n - 1) m[i] = if (d[i - 1] * d[i] <= 0) 0f else (d[i - 1] + d[i]) / 2
                for (i in 0 until n - 1) {
                    if (d[i] == 0f) { m[i] = 0f; m[i + 1] = 0f } else {
                        val a = m[i] / d[i]; val b = m[i + 1] / d[i]
                        val s = a * a + b * b
                        if (s > 9) { val t = 3 / kotlin.math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i] }
                    }
                }
                for (i in 0 until n - 1) {
                    val h = pts[i + 1].x - pts[i].x
                    cubicTo(pts[i].x + h / 3, pts[i].y + m[i] * h / 3, pts[i + 1].x - h / 3, pts[i + 1].y - m[i + 1] * h / 3, pts[i + 1].x, pts[i + 1].y)
                }
            }
        }
        drawPath(path, Theme.green, style = Stroke(2.5.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        pts.forEach { drawCircle(Theme.green, 3.5.dp.toPx(), it) }

        // X labels: thin out so they don't collide.
        val sample = measurer.measure("00-00", labelStyle).size.width
        val every = maxOf(1, ceil((sample + 6.dp.toPx()) / ((right - left) / maxOf(1, values.size - 1))).toInt())
        history.forEachIndexed { i, h ->
            if (i % every != 0 && i != history.size - 1) return@forEachIndexed
            val label = if (h.date.length > 5) h.date.drop(5) else h.date
            val m = measurer.measure(label, labelStyle)
            drawText(m, topLeft = Offset((x(i) - m.size.width / 2f).coerceIn(0f, size.width - m.size.width), bottom + 4.dp.toPx()))
        }
    }
}
