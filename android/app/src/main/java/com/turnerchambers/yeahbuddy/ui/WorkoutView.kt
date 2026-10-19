package com.turnerchambers.yeahbuddy.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.scale
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.ExerciseCatalog
import com.turnerchambers.yeahbuddy.data.LoggedExercise
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.data.Workout
import java.util.Calendar
import kotlin.math.roundToInt

/** Port of WorkoutLogger.jsx: start screen when idle, live logger when a workout is running. */
@Composable
fun WorkoutView() {
    if (Store.data.activeWorkout != null) ActiveWorkoutView() else StartWorkoutView()
}

// region Start screen

@Composable
fun StartWorkoutView() {
    val data = Store.data
    var showCustom by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Workout?>(null) }
    var tileName by remember { mutableStateOf("") }
    var deleting by remember { mutableStateOf<Workout?>(null) }

    LaunchedEffect(Store.pendingTilePrompt) { tileName = Store.pendingTilePrompt?.name ?: "" }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(bottom = 32.dp)) {
        Column(Modifier.fillMaxWidth().padding(top = 24.dp, bottom = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                buildAnnotatedString {
                    withStyle(SpanStyle(color = Color.White)) { append("YEAH ") }
                    withStyle(SpanStyle(color = Theme.green)) { append("BUDDY") }
                },
                fontSize = 46.sp, fontWeight = FontWeight.Black, letterSpacing = (-1).sp,
            )
            Text(dailyTagline(), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.muted)
        }

        Column(Modifier.padding(horizontal = 16.dp)) {
            Text("Start Workout", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(if (data.userName.isEmpty()) "Choose your split" else "Hey ${data.userName} 👋", fontSize = 15.sp, color = Theme.muted)
        }

        // 2-column grid of tiles
        val tiles = mutableListOf<@Composable (Modifier) -> Unit>()
        for (split in ExerciseCatalog.splits) {
            tiles.add { m -> StartTile(ExerciseCatalog.splitLabel(split), "Tap to start", Theme.border, modifier = m) { Store.startWorkout(split) } }
        }
        tiles.add { m ->
            StartTile("Custom", "Build your own", Theme.green.copy(alpha = 0.33f), dashed = true, titleColor = Theme.green,
                icon = Icons.Filled.Edit, modifier = m) { showCustom = true }
        }
        for (tile in data.homeTiles) {
            tiles.add { m ->
                var menu by remember { mutableStateOf(false) }
                Box(m) {
                    StartTile(tile.name, "${tile.exercises.size} exercises", Theme.green.copy(alpha = 0.27f),
                        onLongClick = { menu = true }) {
                        Store.startWorkout("custom", tile.name, tile.exercises)
                    }
                    DropdownMenu(menu, { menu = false }) {
                        DropdownMenuItem(text = { Text("Remove Tile", color = Theme.red) }, leadingIcon = { Icon(Icons.Filled.Delete, null, tint = Theme.red) },
                            onClick = { menu = false; Store.deleteHomeTile(tile.id) })
                    }
                }
            }
        }
        Column(Modifier.padding(horizontal = 16.dp).padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            tiles.chunked(2).forEach { row ->
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    row.forEach { it(Modifier.weight(1f).fillMaxHeight()) }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }

        if (data.workouts.isNotEmpty()) {
            SectionLabel("Recent — swipe left or long press", modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 24.dp, bottom = 10.dp))
            Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                data.workouts.take(5).forEach { w ->
                    androidx.compose.runtime.key(w.id) {
                        RecentWorkoutCard(
                            w,
                            onEdit = { editing = w },
                            onStartAgain = { Store.startWorkout(w.split, w.name, w.exercises.map { it.name }) },
                            onArchive = { Store.archive(w.id) },
                            onDelete = { deleting = w },
                        )
                    }
                }
            }
        }
    }

    if (showCustom) {
        CustomWorkoutSheet(onDismiss = { showCustom = false }) { name, exercises -> Store.startWorkout("custom", name, exercises) }
    }
    Store.pendingTilePrompt?.let { w ->
        AlertDialog(
            onDismissRequest = { Store.pendingTilePrompt = null; tileName = "" },
            containerColor = Theme.card2,
            title = { Text("Save as new workout?", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Add this to your home screen for quick access next time.", color = Theme.soft, fontSize = 14.sp)
                    YBField(tileName, { tileName = it }, "e.g. \"Push A\", \"Upper Body\"",
                        Modifier.fillMaxWidth().card(Theme.field, 8.dp).padding(12.dp))
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val name = tileName.trim()
                    if (name.isNotEmpty()) Store.saveHomeTile(name, w.exercises.map { it.name })
                    tileName = ""; Store.pendingTilePrompt = null
                }) { Text("Save Tile", color = Theme.green, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { tileName = ""; Store.pendingTilePrompt = null }) { Text("No thanks", color = Theme.soft) }
            },
        )
    }
    editing?.let { w -> EditWorkoutSheet(w, onDismiss = { editing = null }) { Store.updateWorkout(it) } }
    deleting?.let { w ->
        AlertDialog(
            onDismissRequest = { deleting = null },
            containerColor = Theme.card2,
            title = { Text("Delete workout?", color = Color.White) },
            text = { Text("${w.title} · ${w.date}\nRecoverable from Recently Deleted for 3 days.", color = Theme.soft) },
            confirmButton = { TextButton(onClick = { Store.softDelete(w.id); deleting = null }) { Text("Delete", color = Theme.red, fontWeight = FontWeight.Bold) } },
            dismissButton = { TextButton(onClick = { deleting = null }) { Text("Cancel", color = Theme.soft) } },
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun StartTile(
    title: String,
    subtitle: String,
    border: Color,
    modifier: Modifier = Modifier,
    dashed: Boolean = false,
    titleColor: Color = Color.White,
    icon: ImageVector? = null,
    onLongClick: (() -> Unit)? = null,
    onClick: () -> Unit,
) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.96f else 1f, label = "press")
    Column(
        modifier
            .scale(scale)
            .card()
            .then(if (dashed) Modifier.dashedBorder(border) else Modifier.cardBorder(border))
            .combinedClickable(interactionSource = source, indication = null, onLongClick = onLongClick, onClick = onClick)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (icon != null) Icon(icon, null, tint = titleColor, modifier = Modifier.size(15.dp))
            Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = titleColor, maxLines = 1)
        }
        Text(subtitle, fontSize = 12.sp, color = Theme.muted)
    }
}

/** Recent workout row: tap to expand, swipe for Edit/Archive/Delete, long-press for the full menu. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun RecentWorkoutCard(workout: Workout, onEdit: () -> Unit, onStartAgain: () -> Unit, onArchive: () -> Unit, onDelete: () -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    var menu by remember { mutableStateOf(false) }
    SwipeToReveal(
        actions = listOf(
            SwipeAction("Edit", Icons.Filled.EditNote, Theme.soft, onEdit),
            SwipeAction("Archive", Icons.Filled.Archive, Theme.soft, onArchive),
            SwipeAction("Delete", Icons.Filled.Delete, Theme.red, onDelete),
        )
    ) {
        Box {
            Column(Modifier.fillMaxWidth().card()) {
                Row(
                    Modifier.fillMaxWidth()
                        .combinedClickable(interactionSource = null, indication = null, onLongClick = { menu = true }) { expanded = !expanded }
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(workout.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        val n = workout.exercises.size
                        Text("${workout.date} · $n exercise${if (n == 1) "" else "s"}", fontSize = 12.sp, color = Theme.muted)
                    }
                    workout.durationMinutes?.let { mins ->
                        Text("${mins}m", fontSize = 12.sp, color = Theme.green,
                            modifier = Modifier.background(Theme.green.copy(alpha = 0.07f), CircleShape).padding(horizontal = 12.dp, vertical = 4.dp))
                    }
                    Spacer(Modifier.width(8.dp))
                    Icon(if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown, null, tint = Theme.dim, modifier = Modifier.size(18.dp))
                }
                AnimatedVisibility(expanded && workout.exercises.isNotEmpty()) {
                    Column {
                        HorizontalDivider(color = Theme.border)
                        Column(Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
                            workout.exercises.forEach { ExercisePreviewRow(it) }
                        }
                    }
                }
            }
            DropdownMenu(menu, { menu = false }, containerColor = Theme.card2) {
                DropdownMenuItem(text = { Text("Edit") }, leadingIcon = { Icon(Icons.Filled.EditNote, null) }, onClick = { menu = false; onEdit() })
                DropdownMenuItem(text = { Text("Start Again") }, leadingIcon = { Icon(Icons.Filled.Bolt, null) }, onClick = { menu = false; onStartAgain() })
                DropdownMenuItem(text = { Text("Archive") }, leadingIcon = { Icon(Icons.Filled.Archive, null) }, onClick = { menu = false; onArchive() })
                DropdownMenuItem(text = { Text("Delete", color = Theme.red) }, leadingIcon = { Icon(Icons.Filled.Delete, null, tint = Theme.red) }, onClick = { menu = false; onDelete() })
            }
        }
    }
}

@Composable
fun ExercisePreviewRow(exercise: LoggedExercise) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        ExerciseThumb(exercise.name, 36.dp)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(exercise.name, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White, maxLines = 1)
            exercise.topSet?.let { top ->
                val n = exercise.sets.size
                val w = if (top.weight == "BW") " · BW" else if (top.weight.isEmpty()) "" else " · ${top.weight} lbs"
                val r = if (top.reps.isEmpty()) "" else " × ${top.reps}"
                Text("$n set${if (n == 1) "" else "s"}$w$r", fontSize = 12.sp, color = Theme.muted)
            }
            if (exercise.goalWeight.isNotEmpty() || exercise.goalReps.isNotEmpty()) {
                Text("Goal: ${goalText(exercise)}", fontSize = 12.sp, color = Theme.gold)
            }
        }
    }
}

fun goalText(ex: LoggedExercise): String {
    val parts = mutableListOf<String>()
    if (ex.goalWeight.isNotEmpty()) parts.add("${ex.goalWeight} lbs")
    if (ex.goalReps.isNotEmpty()) parts.add("${ex.goalReps} reps")
    return parts.joinToString(" × ")
}

/** Rotating daily tagline (same pools as the web app). */
fun dailyTagline(): String {
    val c = Calendar.getInstance()
    val h = c.get(Calendar.HOUR_OF_DAY)
    val day = c.get(Calendar.DAY_OF_MONTH)
    val morning = listOf("Good morning, handsome 💪", "Rise and grind, king 👑", "Early bird gets the gains ☀️", "Morning pump hits different 🌅")
    val afternoon = listOf("No excuses, get in here 🔥", "Get up, lazy bum 🦁", "Time to earn it 💯", "Midday grind, let's go ⚡")
    val evening = listOf("Get in loser, we're going lifting 🚗", "Evening grind is underrated 🌙", "Last one of the day — make it count 🎯", "Champions don't skip night sessions 🏆")
    val pool = if (h in 5 until 12) morning else if (h in 12 until 18) afternoon else evening
    return pool[day % pool.size]
}

// endregion
// region Swipe-to-reveal

data class SwipeAction(val label: String, val icon: ImageVector, val color: Color, val action: () -> Unit)

@Composable
fun SwipeToReveal(actions: List<SwipeAction>, content: @Composable () -> Unit) {
    val density = LocalDensity.current
    val widthPx = with(density) { (actions.size * 64).dp.toPx() }
    var offset by remember { mutableFloatStateOf(0f) }
    var open by remember { mutableStateOf(false) }
    val shown by animateFloatAsState(offset, label = "swipe")
    var dragging by remember { mutableStateOf(false) }
    val x = if (dragging) offset else shown

    Box(Modifier.fillMaxWidth().height(IntrinsicSize.Min).clipToBounds()) {
        if (x < 0) {
            Row(Modifier.align(Alignment.CenterEnd).fillMaxHeight().padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                actions.forEach { a ->
                    Column(
                        Modifier.width(58.dp).fillMaxHeight()
                            .card(if (a.color == Theme.red) Theme.red.copy(alpha = 0.13f) else Theme.field, 12.dp)
                            .plainClick { offset = 0f; open = false; a.action() },
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Icon(a.icon, null, tint = a.color, modifier = Modifier.size(17.dp))
                        Text(a.label, fontSize = 9.sp, color = a.color)
                    }
                }
            }
        }
        Box(
            Modifier
                .offset { IntOffset(x.roundToInt(), 0) }
                .draggable(
                    orientation = Orientation.Horizontal,
                    state = rememberDraggableState { delta -> offset = (offset + delta).coerceIn(-widthPx - 60f, 0f) },
                    onDragStarted = { dragging = true },
                    onDragStopped = {
                        dragging = false
                        open = offset < -widthPx / 2
                        offset = if (open) -widthPx else 0f
                    },
                )
        ) { content() }
    }
}

// endregion
