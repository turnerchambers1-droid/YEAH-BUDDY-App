package com.turnerchambers.yeahbuddy.ui

import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.ExerciseCatalog
import com.turnerchambers.yeahbuddy.data.ExerciseDef
import com.turnerchambers.yeahbuddy.data.Store

private val muscleGroups = listOf("Chest", "Back", "Shoulder", "Bicep", "Tricep", "Quad", "Hamstring", "Glute", "Abs", "Calf", "Forearm", "Rear Delt", "Trap", "Kettlebell")

/**
 * Port of ExerciseSelector.jsx: search, multi-select muscle groups preset by split,
 * equipment filter, fuzzy "did you mean", and inline create.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExerciseSelector(currentExercises: List<String>, split: String?, onDismiss: () -> Unit, onSelect: (String) -> Unit) {
    var search by remember { mutableStateOf("") }
    val splitGroups = split?.let { ExerciseCatalog.splitMuscleGroups[it] } ?: emptyList()
    var activeGroups by remember { mutableStateOf(if (splitGroups.isEmpty()) setOf("Chest") else splitGroups.toSet()) }
    var activeEquip by remember { mutableStateOf<String?>(null) }
    var showCreate by remember { mutableStateOf(false) }
    var showAllGroups by remember { mutableStateOf(false) }

    val visibleGroups = if (splitGroups.isEmpty() || showAllGroups) muscleGroups
        else muscleGroups.filter { it in splitGroups || it in activeGroups }

    val all = Store.allExercises
    val pool = (if (search.isEmpty()) all.filter { it.muscleGroup in activeGroups } else all).filter { ExerciseCatalog.matchesSearch(it, search) }
    val tags = pool.associate { it.name to (Store.equipmentTag(it.name) ?: "") }
    val equipTypes = ExerciseCatalog.equipmentTagOrder.filter { it in tags.values }
    val filtered = activeEquip?.let { e -> pool.filter { tags[it.name] == e } } ?: pool
    val groups = filtered.groupBy { it.muscleGroup }
    val groupOrder = filtered.map { it.muscleGroup }.distinct()
    val showThumbs = search.isNotEmpty() && filtered.isNotEmpty() && filtered.size <= 20

    fun pick(name: String) { onSelect(name); onDismiss() }

    Sheet("Add Exercise", onDismiss) {
        SearchField(search, { search = it; activeEquip = null }, "Search exercises...", Modifier.padding(horizontal = 16.dp).padding(bottom = 8.dp))
        Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 16.dp).padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (search.isEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    visibleGroups.forEach { g ->
                        val on = g in activeGroups
                        Text(g, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = if (on) Color.Black else Theme.soft,
                            modifier = Modifier.background(if (on) Theme.green else Theme.raised, CircleShape)
                                .plainClick { activeGroups = if (on) activeGroups - g else activeGroups + g; activeEquip = null }
                                .padding(horizontal = 16.dp, vertical = 8.dp))
                    }
                    if (splitGroups.isNotEmpty()) {
                        Row(Modifier.dashedBorder(Theme.field, 50.dp, 4f, 3f).plainClick { showAllGroups = !showAllGroups }.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(if (showAllGroups) Icons.Filled.Remove else Icons.Filled.Add, null, tint = Theme.soft, modifier = Modifier.size(16.dp))
                            Text(if (showAllGroups) "Less" else "More", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Theme.soft)
                        }
                    }
                }
            }

            if (equipTypes.isNotEmpty()) {
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (activeEquip != null) {
                        Row(Modifier.background(Theme.raised, CircleShape).plainClick { activeEquip = null }.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Filled.Close, null, tint = Theme.soft, modifier = Modifier.size(13.dp))
                            Text("All", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.soft)
                        }
                    }
                    equipTypes.forEach { e ->
                        val on = activeEquip == e
                        val c = Theme.equipColor(e)
                        Text(e, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (on) c else Color(0xFF666666),
                            modifier = Modifier.background(if (on) c.copy(alpha = 0.13f) else Theme.raised, CircleShape)
                                .border(1.dp, if (on) c.copy(alpha = 0.33f) else Theme.field, CircleShape)
                                .plainClick { activeEquip = if (on) null else e }.padding(horizontal = 12.dp, vertical = 6.dp))
                    }
                }
            }

            if (showCreate) {
                CreateExerciseForm(search, onAdd = { ex -> Store.addCustomExercise(ex); pick(ex.name) }, onCancel = { showCreate = false })
            }

            if (search.isNotEmpty() && filtered.isEmpty()) {
                val fuzzy = fuzzySuggestions(all, search)
                if (fuzzy.isNotEmpty()) {
                    SectionLabel("Did you mean…")
                    ExerciseList(fuzzy, currentExercises, false, ::pick)
                }
                if (!showCreate) {
                    Column(Modifier.fillMaxWidth().padding(vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(Icons.Filled.Search, null, tint = Theme.dim, modifier = Modifier.size(30.dp))
                        Text("No exercises found for \"$search\"", fontSize = 15.sp, color = Theme.muted)
                        Row(Modifier.card(Theme.green.copy(alpha = 0.13f)).border(1.dp, Theme.green.copy(alpha = 0.27f), RoundedCornerShape(16.dp))
                            .plainClick { showCreate = true }.padding(horizontal = 20.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Filled.Add, null, tint = Theme.green, modifier = Modifier.size(16.dp))
                            Text("Create \"$search\"", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Theme.green)
                        }
                    }
                }
            }

            if (search.isEmpty() && activeGroups.isEmpty()) EmptyState(Icons.Filled.TouchApp, "Select a muscle group above")
            if (activeEquip != null && filtered.isEmpty() && activeGroups.isNotEmpty()) {
                EmptyState(Icons.Filled.FilterList, "No $activeEquip exercises in this group")
            }

            groupOrder.forEach { g ->
                SectionLabel(g, Theme.green, Modifier.padding(top = 4.dp))
                ExerciseList(groups[g] ?: emptyList(), currentExercises, showThumbs, ::pick)
            }

            if (search.isNotEmpty() && filtered.isNotEmpty() && !showCreate) {
                Row(Modifier.fillMaxWidth().card().dashedBorder(Theme.green.copy(alpha = 0.27f)).plainClick { showCreate = true }.padding(vertical = 16.dp),
                    horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Add, null, tint = Theme.green, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Create New Exercise", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Theme.green)
                }
            }
        }
    }
}

@Composable
private fun ExerciseList(items: List<ExerciseDef>, currentExercises: List<String>, thumbs: Boolean, onPick: (String) -> Unit) {
    Column(Modifier.fillMaxWidth().card()) {
        items.forEachIndexed { i, ex ->
            val added = ex.name in currentExercises
            Row(
                Modifier.fillMaxWidth().alpha(if (added) 0.4f else 1f).plainClick { if (!added) onPick(ex.name) }.padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (thumbs) ExerciseThumb(ex.name, 40.dp)
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(ex.name, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color.White, maxLines = 1, modifier = Modifier.weight(1f, fill = false))
                        Store.equipmentTag(ex.name)?.let { Tag(it, Theme.equipColor(it)) }
                    }
                    Text(ex.primaryMuscles.joinToString(", ") { it.replace("_", " ") }, fontSize = 12.sp, color = Theme.muted)
                }
                if (added) Text("Added", fontSize = 12.sp, color = Theme.green)
                else Icon(Icons.Filled.Add, null, tint = Theme.dim, modifier = Modifier.size(18.dp))
            }
            if (i < items.size - 1) HorizontalDivider(color = Theme.border)
        }
    }
}

private fun fuzzySuggestions(all: List<ExerciseDef>, search: String): List<ExerciseDef> {
    val q = search.lowercase()
    fun score(name: String): Double {
        val a = name.lowercase()
        if (a == q) return 0.0
        if (a.contains(q) || q.contains(a)) return 1.0
        val aw = a.split(" ").filter { it.isNotEmpty() }
        val bw = q.split(" ").filter { it.isNotEmpty() }
        val overlap = aw.count { w -> bw.any { it.contains(w) || w.contains(it) } }
        if (overlap > 0) return 2 - overlap * 0.1
        val matches = a.zip(q).count { it.first == it.second }
        return 3 - matches.toDouble() / maxOf(a.length, q.length)
    }
    return all.map { it to score(it.name) }.filter { it.second < 2.5 }.sortedBy { it.second }.take(5).map { it.first }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CreateExerciseForm(initialName: String, onAdd: (ExerciseDef) -> Unit, onCancel: () -> Unit) {
    var name by remember { mutableStateOf(initialName) }
    var primary by remember { mutableStateOf("") }
    var equipment by remember { mutableStateOf("") }

    Column(
        Modifier.fillMaxWidth().card(Theme.card2).border(1.dp, Theme.green.copy(alpha = 0.2f), RoundedCornerShape(16.dp)).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Create New Exercise", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Theme.green, modifier = Modifier.weight(1f))
            Icon(Icons.Filled.Close, "Cancel", tint = Theme.muted, modifier = Modifier.size(20.dp).plainClick(onClick = onCancel))
        }
        YBField(name, { name = it }, "Exercise name", Modifier.fillMaxWidth().card(Theme.field, 12.dp).padding(horizontal = 12.dp, vertical = 10.dp))
        Text("Primary Muscle", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.muted)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            ExerciseCatalog.muscleLabels.take(16).forEach { (id, label) -> Pill(label, primary == id) { primary = id } }
        }
        Text("Equipment", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.muted)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            ExerciseCatalog.equipmentOptions.forEach { e -> Pill(e, equipment == e) { equipment = e } }
        }
        val ready = name.isNotBlank() && primary.isNotEmpty()
        Text("Add Exercise", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = if (ready) Color.Black else Theme.muted,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = Modifier.fillMaxWidth().card(if (ready) Theme.green else Theme.field, 12.dp)
                .plainClick(enabled = ready) {
                    onAdd(ExerciseDef(name = name.trim(), split = inferSplit(primary), muscleGroup = ExerciseCatalog.muscleLabel(primary),
                        primaryMuscles = listOf(primary), secondaryMuscles = emptyList(), equipment = equipment.ifEmpty { "Other" }, custom = true))
                }
                .padding(vertical = 12.dp))
    }
}

private fun inferSplit(m: String): String = when (m) {
    "chest", "biceps", "forearms" -> "ChestBi"
    "lats", "mid_back", "lower_back", "triceps", "traps" -> "BackTri"
    "front_delt", "side_delt", "rear_delt", "abs", "abductors", "adductors" -> "Shoulders"
    else -> "LegsAbs"
}
