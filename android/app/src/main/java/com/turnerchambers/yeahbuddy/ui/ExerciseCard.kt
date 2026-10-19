package com.turnerchambers.yeahbuddy.ui

import android.view.HapticFeedbackConstants
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.StickyNote2
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowCircleUp
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.TrackChanges
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
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.ExerciseCatalog
import com.turnerchambers.yeahbuddy.data.ExerciseHistoryEntry
import com.turnerchambers.yeahbuddy.data.Fmt
import com.turnerchambers.yeahbuddy.data.LoggedExercise
import com.turnerchambers.yeahbuddy.data.LoggedSet
import com.turnerchambers.yeahbuddy.data.SessionNoteEntry
import com.turnerchambers.yeahbuddy.data.Store
import kotlinx.coroutines.delay
import kotlin.math.min
import kotlin.math.roundToLong

/** Port of ExerciseCard + SetRow from WorkoutLogger.jsx, plus the setup / session notes. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExerciseCard(exercise: LoggedExercise, isCurrent: Boolean, expanded: Boolean, onToggleExpand: () -> Unit) {
    val name = exercise.name
    var editingEquip by remember { mutableStateOf(false) }
    var editingGoal by remember { mutableStateOf(false) }
    var showLastSessions by remember { mutableStateOf(false) }
    var showNotesHistory by remember { mutableStateOf(false) }
    var editingSetup by remember { mutableStateOf(false) }
    LaunchedEffect(expanded) { editingSetup = false }

    val history = Store.history(name)
    val pr = history.maxOfOrNull { it.maxWeight } ?: 0.0
    val currentEquip = Store.equipmentTag(name)
    val maxWeight = exercise.sets.maxOfOrNull { it.weightValue } ?: 0.0
    val isBWPR = exercise.sets.any { it.weight == "BW" } && history.none { it.hasBW }
    val isPR = (maxWeight > 0 && maxWeight > pr) || isBWPR
    val lastSessions = history.takeLast(3).reversed()
    val lastSession = lastSessions.firstOrNull()
    val lastSet = lastSession?.sets?.lastOrNull()
    val showPrevMoveUp = (lastSession?.readyToMoveUp ?: false) && !exercise.readyToMoveUp
    val setupNote = Store.setupNote(name)
    val previousNote = Store.latestPreviousNote(name)

    Column(
        Modifier.fillMaxWidth().card()
            .border(1.dp, if (isCurrent) Theme.green.copy(alpha = 0.25f) else Color.Transparent, RoundedCornerShape(16.dp))
    ) {
        HeaderRow(exercise, currentEquip, isPR, showPrevMoveUp, expanded, onToggleExpand, editingEquip, editingGoal,
            onToggleEquip = { editingEquip = !editingEquip }, onToggleGoal = { editingGoal = !editingGoal })

        AnimatedVisibility(editingEquip) { EquipmentEditor(name) { editingEquip = false } }
        AnimatedVisibility(editingGoal) { GoalEditor(exercise, history) { editingGoal = false } }

        Column(Modifier.padding(horizontal = 16.dp).padding(bottom = if (expanded) 4.dp else 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            // Setup note — permanent, always visible.
            if (setupNote.isNotEmpty() && !(expanded && editingSetup)) {
                Row(
                    Modifier.fillMaxWidth().card(Theme.card2, 8.dp).plainClick { if (expanded) editingSetup = true else onToggleExpand() }.padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(Icons.Filled.Build, null, tint = Theme.gold, modifier = Modifier.size(12.dp).padding(top = 2.dp))
                    Text(setupNote, fontSize = 12.sp, color = Theme.gold.copy(alpha = 0.9f))
                }
            }

            if (exercise.goalWeight.isNotEmpty() || exercise.goalReps.isNotEmpty()) {
                Row(Modifier.card(Theme.card2, 8.dp).padding(horizontal = 10.dp, vertical = 5.dp), verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Filled.TrackChanges, null, tint = Theme.gold, modifier = Modifier.size(12.dp))
                    Text(
                        buildAnnotatedString {
                            withStyle(SpanStyle(color = Theme.muted)) { append("Goal: ") }
                            withStyle(SpanStyle(color = Theme.gold, fontWeight = FontWeight.SemiBold)) { append(goalText(exercise)) }
                            exercise.topSet?.let { top ->
                                withStyle(SpanStyle(color = Theme.muted)) { append(" · Now: ") }
                                val w = if (top.weight == "BW") "BW" else "${top.weight.ifEmpty { "—" }} lbs"
                                withStyle(SpanStyle(color = Theme.text, fontWeight = FontWeight.SemiBold)) { append("$w × ${top.reps.ifEmpty { "—" }}") }
                            }
                        },
                        fontSize = 12.sp,
                    )
                }
            }

            if (lastSet != null && (lastSet.weight == "BW" || lastSet.weightValue > 0)) {
                Text(
                    buildAnnotatedString {
                        withStyle(SpanStyle(color = Theme.muted)) { append("Last: ") }
                        withStyle(SpanStyle(color = Theme.green, fontWeight = FontWeight.SemiBold, textDecoration = TextDecoration.Underline)) {
                            append("${Fmt.weight(lastSet.weight)} × ${lastSet.repsValue}")
                        }
                        withStyle(SpanStyle(color = Theme.dim)) { append("  — tap for last ${lastSessions.size}") }
                    },
                    fontSize = 12.sp,
                    modifier = Modifier.card(Theme.card2, 8.dp).plainClick { showLastSessions = true }.padding(horizontal = 10.dp, vertical = 5.dp),
                )
            }

            if (exercise.readyToMoveUp) Banner("Ready to increase weight next session")
            if (showPrevMoveUp) Banner("You flagged this to increase weight last session — try going up")

            // Session note stays visible (collapsed) until a newer one replaces it.
            if (!expanded) {
                val shown = if (exercise.notes.isBlank()) previousNote?.text else exercise.notes
                if (!shown.isNullOrEmpty()) {
                    Row(Modifier.padding(horizontal = 2.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.AutoMirrored.Filled.StickyNote2, null, tint = Theme.soft, modifier = Modifier.size(12.dp).padding(top = 2.dp))
                        Text(shown, fontSize = 12.sp, color = Theme.soft, maxLines = 2)
                    }
                }
            }
        }

        if (expanded) ExpandedBody(exercise, history, previousNote) { showNotesHistory = true }
    }

    if (showLastSessions) LastSessionsSheet(name, lastSessions) { showLastSessions = false }
    if (showNotesHistory) NotesHistorySheet(name) { showNotesHistory = false }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun HeaderRow(
    exercise: LoggedExercise, currentEquip: String?, isPR: Boolean, showPrevMoveUp: Boolean,
    expanded: Boolean, onToggleExpand: () -> Unit, editingEquip: Boolean, editingGoal: Boolean,
    onToggleEquip: () -> Unit, onToggleGoal: () -> Unit,
) {
    val name = exercise.name
    var editingName by remember { mutableStateOf(false) }
    var nameInput by remember { mutableStateOf("") }
    var confirmRemove by remember { mutableStateOf(false) }
    val focus = remember { FocusRequester() }

    LaunchedEffect(confirmRemove) { if (confirmRemove) { delay(3000); confirmRemove = false } }

    fun commitRename() {
        Store.renameExercise(name, nameInput)
        editingName = false
    }

    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        if (editingName) {
            YBField(nameInput, { nameInput = it }, "Exercise name",
                Modifier.weight(1f).card(Theme.raised, 8.dp).border(1.dp, Theme.green.copy(alpha = 0.27f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 6.dp).focusRequester(focus),
                fontSize = 15.sp, weight = FontWeight.Bold,
                keyboard = KeyboardOptions(imeAction = ImeAction.Done), actions = KeyboardActions(onDone = { commitRename() }))
            LaunchedEffect(Unit) { focus.requestFocus() }
            Text("Done", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.green,
                modifier = Modifier.card(Theme.green.copy(alpha = 0.13f), 8.dp).plainClick { commitRename() }.padding(horizontal = 12.dp, vertical = 6.dp))
        } else {
            FlowRow(Modifier.weight(1f).plainClick(onClick = onToggleExpand), horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)) {
                ExerciseNameLabel(name, currentEquip)
                if (currentEquip != null) Box(Modifier.align(Alignment.CenterVertically)) { Tag(currentEquip, Theme.equipColor(currentEquip)) }
                if (isPR) Box(Modifier.align(Alignment.CenterVertically)) { Tag("PR!", Theme.green) }
                if (showPrevMoveUp) {
                    Row(Modifier.align(Alignment.CenterVertically).background(Theme.cyan.copy(alpha = 0.13f), CircleShape).padding(horizontal = 6.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        Icon(Icons.Filled.ArrowCircleUp, null, tint = Theme.cyan, modifier = Modifier.size(12.dp))
                        Text("Up weight", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Theme.cyan)
                    }
                }
                if (exercise.sets.isNotEmpty()) {
                    val n = exercise.sets.size
                    Text("$n set${if (n > 1) "s" else ""}", fontSize = 12.sp, color = Theme.muted, modifier = Modifier.align(Alignment.CenterVertically))
                }
            }
            IconBtn(Icons.Filled.Edit, false) { nameInput = name; editingName = true }
            IconBtn(Icons.Filled.FitnessCenter, editingEquip, onClick = onToggleEquip)
            IconBtn(Icons.Filled.TrackChanges, editingGoal,
                idle = if (exercise.goalWeight.isNotEmpty() || exercise.goalReps.isNotEmpty()) Theme.gold else Theme.dim, onClick = onToggleGoal)
            IconBtn(Icons.Filled.ArrowCircleUp, exercise.readyToMoveUp, activeColor = Theme.cyan, size = 19.dp) { Store.toggleReadyToMoveUp(name) }
            Box(
                Modifier.card(if (confirmRemove) Theme.red.copy(alpha = 0.1f) else Color.Transparent, 8.dp)
                    .plainClick { if (confirmRemove) Store.removeExercise(name) else confirmRemove = true }
                    .padding(6.dp),
                contentAlignment = Alignment.Center,
            ) {
                if (confirmRemove) Text("remove?", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Theme.red)
                else Icon(Icons.Filled.Close, "Remove", tint = Theme.dim, modifier = Modifier.size(18.dp))
            }
            Icon(if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown, null, tint = Theme.dim,
                modifier = Modifier.size(22.dp).plainClick(onClick = onToggleExpand))
        }
    }
}

@Composable
private fun IconBtn(icon: ImageVector, active: Boolean, activeColor: Color = Theme.green, idle: Color = Theme.dim, size: Dp = 15.dp, onClick: () -> Unit) {
    Box(
        Modifier.size(28.dp).card(if (active) activeColor.copy(alpha = 0.13f) else Color.Transparent, 8.dp).plainClick(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) { Icon(icon, null, tint = if (active) activeColor else idle, modifier = Modifier.size(size)) }
}

@Composable
private fun Banner(text: String) {
    Row(
        Modifier.fillMaxWidth().card(Theme.cyan.copy(alpha = 0.07f), 8.dp).border(1.dp, Theme.cyan.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(Icons.Filled.ArrowCircleUp, null, tint = Theme.cyan, modifier = Modifier.size(15.dp))
        Text(text, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.cyan)
    }
}

// region Editors

@Composable
private fun EquipmentEditor(name: String, onDone: () -> Unit) {
    val chosen = Store.equipmentChoice(name)
    Column(Modifier.padding(start = 16.dp, end = 16.dp, bottom = 8.dp).fillMaxWidth().card(Theme.card2, 12.dp).padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Equipment — saved for future workouts", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Theme.muted)
        EquipmentPicker(chosen ?: ExerciseCatalog.equipmentOption(Store.equipmentTag(name))) { opt ->
            Store.setEquipment(name, opt)
            onDone()
        }
    }
}

@Composable
private fun GoalEditor(exercise: LoggedExercise, history: List<ExerciseHistoryEntry>, onDone: () -> Unit) {
    val name = exercise.name
    val focusManager = LocalFocusManager.current
    Column(Modifier.padding(start = 16.dp, end = 16.dp, bottom = 8.dp).fillMaxWidth().card(Theme.card2, 12.dp).padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            for (r in listOf("8", "15")) {
                val on = exercise.goalReps == r
                Text("$r reps", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = if (on) Theme.green else Theme.soft,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.weight(1f).card(if (on) Theme.green.copy(alpha = 0.13f) else Theme.field, 8.dp)
                        .border(1.dp, if (on) Theme.green.copy(alpha = 0.27f) else Color.Transparent, RoundedCornerShape(8.dp))
                        .plainClick {
                            if (on) Store.updateGoal(name, "", "")
                            else Store.updateGoal(name, bestWeight(r, history) ?: exercise.goalWeight, r)
                        }
                        .padding(vertical = 8.dp))
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            YBField(exercise.goalWeight, { Store.updateGoal(name, weight = it) }, "goal lbs",
                Modifier.weight(1f).card(Theme.field, 8.dp).padding(vertical = 8.dp),
                weight = FontWeight.SemiBold, center = true, keyboard = KeyboardOptions(keyboardType = KeyboardType.Decimal))
            Text("Done", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.green,
                modifier = Modifier.card(Theme.green.copy(alpha = 0.13f), 8.dp).plainClick { focusManager.clearFocus(); onDone() }
                    .padding(horizontal = 12.dp, vertical = 6.dp))
        }
        if (exercise.goalReps.isNotEmpty() && exercise.goalWeight.isEmpty()) {
            Text("No weight has hit ${exercise.goalReps} reps twice yet — enter one manually.", fontSize = 12.sp, color = Theme.muted)
        }
    }
}

/** Heaviest weight hit for the target reps in at least 2 sets across history. */
private fun bestWeight(reps: String, history: List<ExerciseHistoryEntry>): String? {
    val counts = mutableMapOf<String, Int>()
    for (s in history.flatMap { it.sets }) if (s.reps == reps && s.weight.isNotEmpty()) counts[s.weight] = (counts[s.weight] ?: 0) + 1
    return counts.filter { it.value >= 2 }.keys.maxByOrNull { if (it == "BW") 0.0 else it.toDoubleOrNull() ?: 0.0 }
}

// endregion
// region Expanded

@Composable
private fun ExpandedBody(exercise: LoggedExercise, history: List<ExerciseHistoryEntry>, previousNote: SessionNoteEntry?, onHistory: () -> Unit) {
    val name = exercise.name
    val view = LocalView.current
    Column(Modifier.padding(start = 16.dp, end = 16.dp, bottom = 12.dp)) {
        if (exercise.sets.isNotEmpty()) {
            Row(Modifier.padding(bottom = 2.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Spacer(Modifier.width(20.dp))
                Text("WEIGHT", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Theme.muted, modifier = Modifier.weight(1f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                Text("REPS", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Theme.muted, modifier = Modifier.weight(1f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                Spacer(Modifier.width(30.dp))
            }
        }
        exercise.sets.forEachIndexed { i, set ->
            androidx.compose.runtime.key(set.id) { SetRow(name, set, i, history) }
        }

        Row(
            Modifier.padding(top = 8.dp).fillMaxWidth().card(Theme.raised, 12.dp)
                .plainClick { Store.addSet(name); view.performHapticFeedback(HapticFeedbackConstants.CONFIRM) }
                .padding(vertical = 9.dp),
            horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Filled.Add, null, tint = Theme.green, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Add Set", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Theme.green)
        }

        // Setup note (permanent)
        Column(
            Modifier.padding(top = 12.dp).fillMaxWidth().card(Theme.card2, 12.dp).border(1.dp, Theme.gold.copy(alpha = 0.18f), RoundedCornerShape(12.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconLabel(Icons.Filled.Build, "SETUP", Theme.gold, 10.sp, FontWeight.Bold, 11.dp)
                Spacer(Modifier.weight(1f))
                Text("Always shown", fontSize = 10.sp, color = Theme.dim)
            }
            YBField(Store.setupNote(name), { Store.setSetupNote(it, name) }, "Seat 3, handle low slot, pin 4th from top…",
                Modifier.fillMaxWidth(), textColor = Theme.gold.copy(alpha = 0.9f), fontSize = 14.sp, singleLine = false, maxLines = 4)
        }

        // Session notes (rolling, with history)
        Column(
            Modifier.padding(top = 8.dp).fillMaxWidth().card(Theme.card2, 12.dp).border(1.dp, Theme.field, RoundedCornerShape(12.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconLabel(Icons.AutoMirrored.Filled.StickyNote2, "SESSION NOTE", Theme.soft, 10.sp, FontWeight.Bold, 11.dp)
                Spacer(Modifier.weight(1f))
                if (Store.sessionNotes(name).isNotEmpty()) {
                    Text("History", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.green, modifier = Modifier.plainClick(onClick = onHistory))
                }
            }
            if (previousNote != null) {
                Column(
                    Modifier.fillMaxWidth().card(Theme.bg.copy(alpha = 0.5f), 8.dp).dashedBorder(Theme.field, 8.dp, 4f, 3f).padding(8.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Row {
                        Text("Last time · ${previousNote.date}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Theme.muted)
                        Spacer(Modifier.weight(1f))
                        if (exercise.notes.isEmpty()) {
                            Text("Use this", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Theme.green,
                                modifier = Modifier.plainClick { Store.updateNotes(name, previousNote.text) })
                        }
                    }
                    Text(previousNote.text, fontSize = 13.sp, color = Theme.soft)
                }
            }
            YBField(exercise.notes, { Store.updateNotes(name, it) }, "Notes for today: how it felt, cues…",
                Modifier.fillMaxWidth(), textColor = Color(0xFFAAAAAA), fontSize = 14.sp, singleLine = false, minLines = 2, maxLines = 6)
        }
    }
}

// endregion
// region Set row

private enum class SetField { Weight, Reps }

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SetRow(exerciseName: String, set: LoggedSet, index: Int, history: List<ExerciseHistoryEntry>) {
    var focused by remember { mutableStateOf<SetField?>(null) }
    val isBW = set.weight == "BW"
    val currentWeight = if (isBW) 0.0 else (set.weight.toDoubleOrNull() ?: 0.0)
    val currentReps = set.reps.toIntOrNull() ?: 0
    fun setWeight(v: String) = Store.updateSet(exerciseName, set.id, weight = v)
    fun setReps(v: String) = Store.updateSet(exerciseName, set.id, reps = v)

    Column(Modifier.padding(vertical = 5.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("${index + 1}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.muted, modifier = Modifier.width(20.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            YBField(
                set.weight, { setWeight(it) }, "lbs",
                Modifier.weight(1f).card(if (isBW) Theme.green.copy(alpha = 0.13f) else Theme.field, 8.dp).padding(vertical = 8.dp)
                    .onFocusChanged { if (it.isFocused) focused = SetField.Weight else if (focused == SetField.Weight) focused = null },
                textColor = if (isBW) Theme.green else Color.White, weight = FontWeight.SemiBold, center = true,
                keyboard = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                trailing = if (!isBW) ({ Text("lbs", fontSize = 11.sp, color = Theme.dim, modifier = Modifier.padding(end = 8.dp)) }) else null,
            )
            YBField(
                set.reps, { setReps(it) }, "reps",
                Modifier.weight(1f).card(Theme.field, 8.dp).padding(vertical = 8.dp)
                    .onFocusChanged { if (it.isFocused) focused = SetField.Reps else if (focused == SetField.Reps) focused = null },
                textColor = Color.White, weight = FontWeight.SemiBold, center = true,
                keyboard = KeyboardOptions(keyboardType = KeyboardType.Number),
                trailing = { Text("reps", fontSize = 11.sp, color = Theme.dim, modifier = Modifier.padding(end = 8.dp)) },
            )
            Box(Modifier.size(30.dp).plainClick { Store.removeSet(exerciseName, set.id) }, contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Delete, "Delete set", tint = Theme.muted, modifier = Modifier.size(17.dp))
            }
        }

        if (focused == SetField.Weight) {
            FlowRow(Modifier.padding(start = 28.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                if (isBW) {
                    ChipButton("Clear BW") { setWeight("") }
                } else {
                    ChipButton("BW") { setWeight("BW") }
                    if (currentWeight >= 5) ChipButton("-5") { setWeight(Fmt.number(currentWeight - 5)) }
                    if (currentWeight >= 2.5) ChipButton("-2.5") { setWeight(Fmt.number(currentWeight - 2.5)) }
                    ChipButton("+2.5") { setWeight(Fmt.number(currentWeight + 2.5)) }
                    ChipButton("+5") { setWeight(Fmt.number(currentWeight + 5)) }
                    ChipButton("+10") { setWeight(Fmt.number(currentWeight + 10)) }
                }
            }
        }
        if (focused == SetField.Reps) {
            FlowRow(Modifier.padding(start = 28.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (r in listOf("8", "10", "12", "15")) ChipButton(r) { setReps(r) }
                if (currentReps > 1) ChipButton("−1") { setReps((currentReps - 1).toString()) }
                ChipButton("+1") { setReps((currentReps + 1).toString()) }
            }
        }

        // Weight suggestions once reps are in but weight is empty.
        if (currentReps > 0 && currentWeight == 0.0 && !isBW) {
            suggestions(currentReps, history)?.let { s ->
                Column(Modifier.padding(start = 28.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    SuggestionButton("📊 ${Fmt.number(s.first)} lbs × ${s.second} last time") { setWeight(Fmt.number(s.first)) }
                    SuggestionButton("⚡ ~${Fmt.number(s.third)} lbs ($currentReps rep est.)") { setWeight(Fmt.number(s.third)) }
                }
            }
        }
    }
}

@Composable
private fun SuggestionButton(text: String, onClick: () -> Unit) {
    Text(text, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.soft,
        modifier = Modifier.card(Theme.raised, 8.dp).border(1.dp, Theme.field, RoundedCornerShape(8.dp)).plainClick(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp))
}

/** Epley 1RM from last session's heaviest set, scaled to the entered reps. (lastWeight, lastReps, suggested) */
private fun suggestions(reps: Int, history: List<ExerciseHistoryEntry>): Triple<Double, Int, Double>? {
    val last = history.lastOrNull() ?: return null
    var best = last.sets.firstOrNull() ?: return null
    for (s in last.sets) if (s.weightValue > best.weightValue) best = s
    if (best.weightValue <= 0) return null
    val oneRM = Math.round(best.weightValue * (1 + best.repsValue / 30.0)).toDouble()
    val factors = mapOf(1 to 1.0, 2 to 0.95, 3 to 0.93, 4 to 0.90, 5 to 0.87, 6 to 0.85, 7 to 0.83, 8 to 0.80, 9 to 0.77,
        10 to 0.75, 11 to 0.72, 12 to 0.67, 13 to 0.65, 14 to 0.62, 15 to 0.60)
    val suggested = (oneRM * (factors[min(reps, 15)] ?: 0.6) / 2.5).roundToLong() * 2.5
    if (suggested <= 0) return null
    return Triple(best.weightValue, best.repsValue, suggested)
}

// endregion

/** Exercise name with descriptor tags. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExerciseNameLabel(name: String, currentEquip: String?) {
    val equipTagMap = mapOf("KB" to "KB", "DB" to "DB", "BB" to "BB", "EZ" to "EZ", "Cable" to "Cable", "Machine" to "Machine", "MAG" to "Cable", "HB" to "Hex")
    val (displayName, rawTags) = ExerciseCatalog.parseDisplay(name)
    // Drop tags that duplicate the (editable) equipment badge.
    val tags = rawTags.filter { equipTagMap[it] == null || equipTagMap[it] != currentEquip }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(displayName, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
        tags.forEach { Tag(it, Theme.equipColor(it)) }
    }
}

/** Equipment chips; tapping the selected one clears it (back to automatic). */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun EquipmentPicker(selected: String?, onPick: (String?) -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        for (opt in ExerciseCatalog.equipmentOptions) {
            val tag = ExerciseCatalog.equipmentTags[opt.lowercase()] ?: opt
            Pill(opt, selected == opt, Theme.equipColor(tag)) { onPick(if (selected == opt) null else opt) }
        }
    }
}
