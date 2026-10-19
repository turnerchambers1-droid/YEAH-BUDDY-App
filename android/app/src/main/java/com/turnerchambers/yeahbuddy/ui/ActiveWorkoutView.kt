package com.turnerchambers.yeahbuddy.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.ExerciseCatalog
import com.turnerchambers.yeahbuddy.data.LoggedExercise
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.data.Workout
import com.turnerchambers.yeahbuddy.data.nowMs
import kotlinx.coroutines.delay

@Composable
fun ActiveWorkoutView() {
    val workout = Store.data.activeWorkout ?: return
    var expanded by rememberSaveable { mutableStateOf(setOf<String>()) }
    var showSelector by remember { mutableStateOf(false) }
    var showFinish by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    // Reveal the exercise a notification tap asked for.
    LaunchedEffect(Store.focusRequest) {
        val name = Store.focusRequest ?: return@LaunchedEffect
        val idx = workout.exercises.indexOfFirst { it.name == name }
        if (idx >= 0) {
            expanded = expanded + workout.exercises[idx].id
            listState.animateScrollToItem(idx + 2)
        }
        Store.focusRequest = null
    }

    LazyColumn(Modifier.fillMaxSize().imePadding(), state = listState) {
        item { Header(workout) { showFinish = true } }
        item { Box(Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp)) { LastSameSplit(workout) } }
        if (workout.exercises.isEmpty()) {
            item {
                Column(Modifier.fillMaxWidth().padding(vertical = 56.dp), horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Icon(Icons.Filled.Add, null, tint = Theme.dim, modifier = Modifier.size(36.dp))
                    Text("Tap below to add your first exercise", fontSize = 15.sp, color = Theme.dim)
                }
            }
        }
        itemsIndexed(workout.exercises, key = { _, ex -> ex.id }) { _, ex ->
            Box(Modifier.padding(horizontal = 16.dp).padding(top = 12.dp)) {
                ExerciseCard(
                    exercise = ex,
                    isCurrent = Store.data.currentExercise == ex.name,
                    expanded = ex.id in expanded,
                    onToggleExpand = {
                        if (ex.id in expanded) expanded = expanded - ex.id
                        else { expanded = expanded + ex.id; Store.setCurrentExercise(ex.name) }
                    },
                )
            }
        }
        // Timer stays mounted in one place so expanding cards never resets it.
        item(key = "timer") { Box(Modifier.padding(horizontal = 16.dp).padding(top = 12.dp)) { RestTimerView() } }
        item(key = "add") {
            Box(Modifier.padding(horizontal = 16.dp).padding(top = 12.dp)) { AddExerciseButton { showSelector = true } }
        }
        item(key = "notes") {
            Box(Modifier.padding(horizontal = 16.dp).padding(top = 16.dp, bottom = 40.dp)) { WorkoutNotes(workout) }
        }
    }

    if (showSelector) {
        ExerciseSelector(
            currentExercises = workout.exercises.map { it.name },
            split = workout.split,
            onDismiss = { showSelector = false },
        ) { name ->
            Store.addExercise(name)
            Store.data.activeWorkout?.exercises?.firstOrNull { it.name == name }?.let { expanded = expanded + it.id }
        }
    }
    if (showFinish) {
        val n = workout.exercises.size
        AlertDialog(
            onDismissRequest = { showFinish = false },
            containerColor = Theme.card2,
            title = { Text("Finish workout?", color = Color.White) },
            text = { Text("$n exercise${if (n == 1) "" else "s"} · ${elapsedString(workout.startTime)}", color = Theme.soft) },
            confirmButton = {
                Column(horizontalAlignment = Alignment.End) {
                    TextButton(onClick = {
                        showFinish = false
                        val wasCustom = workout.split == "custom"
                        val done = Store.finishWorkout()
                        if (done != null && wasCustom) Store.pendingTilePrompt = done
                    }) { Text("Save Workout", color = Theme.green, fontWeight = FontWeight.Bold) }
                    TextButton(onClick = { showFinish = false; Store.discardWorkout() }) { Text("Discard Workout", color = Theme.red) }
                    TextButton(onClick = { showFinish = false }) { Text("Cancel", color = Theme.soft) }
                }
            },
        )
    }
}

@Composable
private fun Header(workout: Workout, onFinish: () -> Unit) {
    var editingTitle by remember { mutableStateOf(false) }
    var titleInput by remember { mutableStateOf("") }
    val focus = remember { FocusRequester() }
    var hadFocus by remember { mutableStateOf(false) }

    fun commit() {
        if (!editingTitle) return
        Store.updateActiveWorkoutName(titleInput)
        editingTitle = false
    }

    Column {
        Row(Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                if (editingTitle) {
                    YBField(
                        titleInput, { titleInput = it }, "Workout name",
                        Modifier.fillMaxWidth().focusRequester(focus).onFocusChanged {
                            if (it.isFocused) hadFocus = true else if (hadFocus) { hadFocus = false; commit() }
                        },
                        fontSize = 18.sp, weight = FontWeight.Bold,
                        keyboard = KeyboardOptions(imeAction = ImeAction.Done),
                        actions = KeyboardActions(onDone = { commit() }),
                    )
                    LaunchedEffect(Unit) { focus.requestFocus() }
                } else {
                    Row(Modifier.plainClick { titleInput = workout.title; editingTitle = true }, verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(workout.title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Icon(Icons.Filled.Edit, null, tint = Theme.dim, modifier = Modifier.size(15.dp))
                    }
                }
                ElapsedTimer(workout.startTime)
            }
            Text("Finish", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.Black,
                modifier = Modifier.card(Theme.green, 12.dp).plainClick(onClick = onFinish).padding(horizontal = 16.dp, vertical = 10.dp))
        }
        HorizontalDivider(color = Theme.card)
    }
}

@Composable
private fun ElapsedTimer(start: Long) {
    var now by remember { mutableLongStateOf(nowMs()) }
    LaunchedEffect(start) { while (true) { now = nowMs(); delay(1000) } }
    Text(elapsedString(start, now), fontSize = 14.sp, fontFamily = FontFamily.Monospace, color = Theme.green)
}

@Composable
private fun LastSameSplit(workout: Workout) {
    val last = if (workout.split == "custom") emptyList() else Store.data.workouts.filter { it.split == workout.split }.take(3)
    if (last.isEmpty()) return
    var show by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().card()) {
        Row(Modifier.fillMaxWidth().plainClick { show = !show }.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("LAST ${if (last.size > 1) "${last.size}X " else ""}${ExerciseCatalog.splitLabel(workout.split).uppercase()}",
                fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp, color = Theme.muted)
            Text("· ${last[0].date}", fontSize = 12.sp, color = Theme.dim)
            Spacer(Modifier.weight(1f))
            Icon(if (show) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown, null, tint = Theme.dim, modifier = Modifier.size(18.dp))
        }
        AnimatedVisibility(show) {
            Column(Modifier.padding(start = 16.dp, end = 16.dp, bottom = 12.dp)) {
                last.forEachIndexed { i, w ->
                    if (i > 0) SectionLabel(w.date, Theme.dim, Modifier.padding(top = 12.dp, bottom = 6.dp))
                    w.exercises.forEach { ex ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(ex.name, fontSize = 14.sp, color = Color.White, modifier = Modifier.weight(1f))
                            Text(summary(ex), fontSize = 12.sp, color = Theme.muted)
                        }
                        HorizontalDivider(color = Theme.card2)
                    }
                }
            }
        }
    }
}

private fun summary(ex: LoggedExercise): String {
    var s = "${ex.sets.size}s"
    ex.topSet?.let { top ->
        if (top.weight.isNotEmpty()) s += " · " + (if (top.weight == "BW") "BW" else "${top.weight} lbs")
        if (top.reps.isNotEmpty()) s += " × ${top.reps}"
    }
    return s
}

@Composable
private fun WorkoutNotes(workout: Workout) {
    Column(
        Modifier.fillMaxWidth().card(Theme.timerBg).cardBorder(Theme.field).padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("WORKOUT NOTES", fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, letterSpacing = 1.5.sp, color = Theme.gold)
        YBField(
            workout.notes, { Store.updateWorkoutNotes(it) }, "Add notes for this workout...",
            Modifier.fillMaxWidth(), textColor = Color(0xFFCCCCCC), fontSize = 15.sp, singleLine = false, minLines = 3, maxLines = 8,
        )
    }
}

@Composable
fun AddExerciseButton(onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().card().dashedBorder(Theme.field).plainClick(onClick = onClick).padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Filled.Add, null, tint = Theme.green, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(6.dp))
        Text("Add Exercise", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Theme.green)
    }
}

fun elapsedString(start: Long, now: Long = nowMs()): String {
    val s = ((now - start) / 1000).coerceAtLeast(0)
    val h = s / 3600; val m = (s % 3600) / 60; val sec = s % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%02d:%02d".format(m, sec)
}
