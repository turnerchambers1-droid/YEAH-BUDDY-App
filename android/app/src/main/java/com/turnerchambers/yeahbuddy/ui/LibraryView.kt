package com.turnerchambers.yeahbuddy.ui

import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.ExerciseCatalog
import com.turnerchambers.yeahbuddy.data.ExerciseDef
import com.turnerchambers.yeahbuddy.data.Fmt
import com.turnerchambers.yeahbuddy.data.Store

private val groupOrder = listOf("chest", "lats", "mid_back", "lower_back", "traps", "front_delt", "side_delt", "rear_delt",
    "biceps", "triceps", "forearms", "quads", "hamstrings", "glutes", "calves", "abs", "adductors", "abductors")

/** Port of LibraryView.jsx — every exercise grouped by primary muscle, with detail + create. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LibraryView() {
    var search by rememberSaveable { mutableStateOf("") }
    var showNew by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<ExerciseDef?>(null) }

    val filtered = Store.allExercises.filter { ExerciseCatalog.matchesSearch(it, search) }
    val grouped = filtered.groupBy { it.primaryMuscles.firstOrNull() ?: "abs" }
    val order = groupOrder.filter { grouped.containsKey(it) } + grouped.keys.filter { it !in groupOrder }.sorted()

    Column(Modifier.fillMaxSize()) {
        ScreenTitle("Exercises") {
            Box(Modifier.size(44.dp).plainClick { showNew = true }, contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Add, "New exercise", tint = Theme.green, modifier = Modifier.size(26.dp))
            }
        }
        SearchField(search, { search = it }, "Search by name or muscle...", Modifier.padding(horizontal = 16.dp).padding(bottom = 4.dp))
        LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
            order.forEach { muscle ->
                item(key = "h-$muscle") { SectionLabel(ExerciseCatalog.muscleLabel(muscle), Theme.green, Modifier.padding(top = 20.dp, bottom = 8.dp)) }
                item(key = "g-$muscle") {
                    val items = grouped[muscle] ?: emptyList()
                    Column(Modifier.fillMaxWidth().card()) {
                        items.forEachIndexed { i, ex ->
                            LibraryRow(ex) { selected = ex }
                            if (i < items.size - 1) HorizontalDivider(color = Theme.border)
                        }
                    }
                }
            }
            item { Spacer(Modifier.padding(bottom = 24.dp)) }
        }
    }

    if (showNew) NewExerciseSheet { showNew = false }
    selected?.let { ExerciseDetailSheet(it) { selected = null } }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun LibraryRow(ex: ExerciseDef, onClick: () -> Unit) {
    val pr = Store.personalRecord(ex.name)
    Row(Modifier.fillMaxWidth().plainClick(onClick = onClick).padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(ex.name, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color.White, maxLines = 1, modifier = Modifier.weight(1f, fill = false))
                Store.equipmentTag(ex.name)?.let { Tag(it, Theme.equipColor(it)) }
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                ex.primaryMuscles.forEach { MuscleChip(it, Theme.green, 0.13f) }
                ex.secondaryMuscles.take(2).forEach { MuscleChip(it, Theme.teal, 0.07f) }
            }
        }
        if (pr > 0) Text("${Fmt.number(pr)}lbs", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.green)
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = Color(0xFF374151), modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun MuscleChip(m: String, c: Color, o: Float) {
    Text(ExerciseCatalog.muscleLabel(m), fontSize = 11.sp, color = c,
        modifier = Modifier.background(c.copy(alpha = o), CircleShape).padding(horizontal = 6.dp, vertical = 2.dp))
}

@Composable
fun ExerciseDetailSheet(exercise: ExerciseDef, onDismiss: () -> Unit) {
    val image = rememberWgerImage(exercise.name)
    Sheet(exercise.name, onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            if (image != null) {
                Image(image, null, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxWidth().heightIn(max = 190.dp).card())
            }
            Column(Modifier.fillMaxWidth().card().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                MuscleBodyMap(exercise.primaryMuscles, exercise.secondaryMuscles)
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.align(Alignment.CenterHorizontally)) {
                    Legend(Theme.green, exercise.primaryMuscles.joinToString(", ") { ExerciseCatalog.muscleLabel(it) })
                    if (exercise.secondaryMuscles.isNotEmpty()) Legend(Theme.teal, exercise.secondaryMuscles.joinToString(", ") { ExerciseCatalog.muscleLabel(it) })
                }
            }

            val pr = Store.personalRecord(exercise.name)
            if (pr > 0) {
                Row(Modifier.fillMaxWidth().card().padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("🏆", fontSize = 28.sp)
                    Column {
                        SectionLabel("Personal Record", Theme.green)
                        Text("${Fmt.number(pr)} lbs", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }

            Column(Modifier.fillMaxWidth().card().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconLabel(Icons.Filled.FitnessCenter, "EQUIPMENT", Theme.soft, 10.sp, FontWeight.Bold, 11.dp)
                    Spacer(Modifier.weight(1f))
                    Text("Used in future workouts", fontSize = 10.sp, color = Theme.dim)
                }
                EquipmentPicker(Store.equipmentChoice(exercise.name) ?: ExerciseCatalog.equipmentOption(Store.equipmentTag(exercise.name))) {
                    Store.setEquipment(exercise.name, it)
                }
            }

            Column(Modifier.fillMaxWidth().card().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                IconLabel(Icons.Filled.Build, "SETUP NOTE", Theme.gold, 10.sp, FontWeight.Bold, 11.dp)
                YBField(Store.setupNote(exercise.name), { Store.setSetupNote(it, exercise.name) }, "Seat 3, handle low slot, pin 4th from top…",
                    Modifier.fillMaxWidth(), textColor = Theme.gold.copy(alpha = 0.9f), singleLine = false, maxLines = 5)
            }
        }
    }
}

@Composable
private fun Legend(c: Color, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(10.dp).background(c, CircleShape))
        Text(text, fontSize = 12.sp, color = Theme.soft)
    }
}

@Composable
fun NewExerciseSheet(onDismiss: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var primary by remember { mutableStateOf(listOf<String>()) }
    var secondary by remember { mutableStateOf(listOf<String>()) }
    var suggested by remember { mutableStateOf(false) }

    Sheet("New Exercise", onDismiss, confirmLabel = "Add", confirmEnabled = name.isNotBlank(), onConfirm = {
        Store.addCustomExercise(ExerciseDef(name = name.trim(), split = "ChestBi",
            muscleGroup = primary.firstOrNull()?.let(::pickerGroup) ?: "Chest", primaryMuscles = primary, secondaryMuscles = secondary))
        onDismiss()
    }) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            SectionLabel("Exercise Name")
            YBField(name, { name = it; suggested = false }, "e.g. Cable Crossover", Modifier.fillMaxWidth().card(Theme.raised, 12.dp).padding(horizontal = 16.dp, vertical = 12.dp))

            if (name.trim().length > 2 && !suggested) {
                Row(
                    Modifier.fillMaxWidth().card(Theme.green.copy(alpha = 0.13f), 12.dp).border(1.dp, Theme.green.copy(alpha = 0.27f), RoundedCornerShape(12.dp))
                        .plainClick { val s = suggestMuscles(name); primary = s.first; secondary = s.second; suggested = true }
                        .padding(vertical = 12.dp),
                    horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
                ) { IconLabel(Icons.Filled.AutoAwesome, "Suggest muscles for \"$name\"", Theme.green) }
            }

            if (primary.isNotEmpty() || secondary.isNotEmpty()) {
                MuscleBodyMap(primary, secondary, compact = true, modifier = Modifier.card().padding(16.dp))
            }

            SectionLabel("Muscle Activation")
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                ExerciseCatalog.muscleLabels.forEach { (id, label) ->
                    Row(Modifier.fillMaxWidth().card(radius = 12.dp).padding(horizontal = 16.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(label, fontSize = 15.sp, color = Color.White, modifier = Modifier.weight(1f))
                        Pill("Primary", id in primary) {
                            primary = if (id in primary) primary - id else primary + id
                            secondary = secondary - id
                        }
                        Pill("Secondary", id in secondary, Theme.teal) {
                            secondary = if (id in secondary) secondary - id else secondary + id
                            primary = primary - id
                        }
                    }
                }
            }
        }
    }
}

/** Map a muscle id to the exercise picker's group tabs so new exercises show up there. */
fun pickerGroup(m: String): String = when (m) {
    "chest" -> "Chest"
    "lats", "mid_back", "lower_back" -> "Back"
    "front_delt", "side_delt" -> "Shoulder"
    "rear_delt" -> "Rear Delt"
    "biceps" -> "Bicep"
    "triceps" -> "Tricep"
    "forearms" -> "Forearm"
    "traps" -> "Trap"
    "quads" -> "Quad"
    "hamstrings" -> "Hamstring"
    "glutes", "adductors", "abductors" -> "Glute"
    "calves" -> "Calf"
    else -> "Abs"
}

/** Keyword-based muscle guess (port of suggestMuscles). */
fun suggestMuscles(raw: String): Pair<List<String>, List<String>> {
    val n = raw.lowercase()
    fun has(pattern: String) = Regex(pattern).containsMatchIn(n)
    val p = mutableListOf<String>(); val s = mutableListOf<String>()
    if (has("bench|chest|fly|pec|press") && !has("shoulder|overhead|military")) { p.add("chest"); s += listOf("front_delt", "triceps") }
    if (has("curl|bicep|preacher|hammer curl") && !has("leg curl|tricep")) { p.add("biceps"); s.add("forearms") }
    if (has("skull|pushdown|extension|dip|tricep|kickback|close grip")) { p.add("triceps"); if (has("dip|close grip")) s += listOf("chest", "front_delt") }
    if (has("pull up|chin up|pull-up|lat|pulldown|row") && !has("upright row")) { p.add("lats"); s += listOf("biceps", "mid_back") }
    if (has("row") && !has("upright row") && "mid_back" !in p) { p.add("mid_back"); s += listOf("lats", "biceps") }
    if (has("shrug|trap")) p.add("traps")
    if (has("shoulder press|overhead press|military|arnold|front raise|lateral raise|lat raise")) {
        if (has("front raise")) p.add("front_delt")
        else if (has("lat raise|lateral")) { p.add("side_delt"); s.add("traps") }
        else { p.add("side_delt"); s += listOf("front_delt", "triceps") }
    }
    if (has("rear delt|face pull|reverse fly")) { p.add("rear_delt"); s += listOf("mid_back", "traps") }
    if (has("squat|leg press|lunge|hack squat|belt squat")) { p.add("quads"); s += listOf("glutes", "hamstrings") }
    if (has("deadlift|rdl|stiff|leg curl|hamstring")) { p.add("hamstrings"); s += listOf("glutes", "lower_back") }
    if (has("glute|hip thrust|back extension")) { p.add("glutes"); s.add("hamstrings") }
    if (has("calf|raise") && !has("shoulder raise|lat raise|front raise")) p.add("calves")
    if (has("crunch|situp|sit-up|ab |abs|leg raise")) p.add("abs")
    if (has("wrist|forearm")) p.add("forearms")
    val up = p.distinct()
    val us = s.filter { it !in up }.distinct()
    return up to us
}
