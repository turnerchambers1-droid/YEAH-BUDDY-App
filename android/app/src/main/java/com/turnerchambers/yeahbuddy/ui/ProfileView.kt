package com.turnerchambers.yeahbuddy.ui

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.FileUpload
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material.icons.filled.TableChart
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.AppData
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.data.WorkoutCSV
import com.turnerchambers.yeahbuddy.data.Ymd
import com.turnerchambers.yeahbuddy.data.nowMs
import kotlin.math.ceil
import kotlin.math.max

private enum class ProfilePage { Main, Deleted, Archived }

/** Port of the Profile tab: data management + data transfer. (No accounts / sign-out.) */
@Composable
fun ProfileView() {
    var page by rememberSaveable { mutableStateOf(ProfilePage.Main) }
    when (page) {
        ProfilePage.Main -> ProfileMain { page = it }
        ProfilePage.Deleted -> { BackHandler { page = ProfilePage.Main }; RecentlyDeletedView { page = ProfilePage.Main } }
        ProfilePage.Archived -> { BackHandler { page = ProfilePage.Main }; ArchivedView { page = ProfilePage.Main } }
    }
}

@Composable
private fun ProfileMain(open: (ProfilePage) -> Unit) {
    val context = LocalContext.current
    val data = Store.data
    var message by remember { mutableStateOf<String?>(null) }
    var pendingImport by remember { mutableStateOf<AppData?>(null) }

    val exportJson = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        message = try {
            context.contentResolver.openOutputStream(uri, "wt")!!.use { it.write(Store.encode().toByteArray()) }
            "Exported all data (${data.workouts.size} workouts)"
        } catch (e: Exception) { "Export failed — ${e.message}" }
    }
    val exportCsv = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        message = try {
            context.contentResolver.openOutputStream(uri, "wt")!!.use { it.write(WorkoutCSV.export(Store.data.workouts).toByteArray()) }
            "Exported ${data.workouts.size} workouts as CSV"
        } catch (e: Exception) { "Export failed — ${e.message}" }
    }
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        val text = try { context.contentResolver.openInputStream(uri)!!.use { it.readBytes().decodeToString() } } catch (_: Exception) { null }
        if (text == null) { message = "Import failed — couldn't read the file"; return@rememberLauncherForActivityResult }
        val trimmed = text.trimStart('﻿', ' ', '\n', '\r', '\t')
        if (trimmed.startsWith("{")) {
            // A YEAH BUDDY data file (the iPhone app's data.json, or an export from here).
            pendingImport = try { Store.decode(trimmed) } catch (_: Exception) { null }
            if (pendingImport == null) message = "Import failed — not a YEAH BUDDY data file"
        } else {
            val parsed = WorkoutCSV.parse(text)
            val added = Store.importWorkouts(parsed)
            message = if (parsed.isEmpty()) "Import failed — check CSV format"
                else "Imported $added workout${if (added == 1) "" else "s"}${if (added < parsed.size) " (${parsed.size - added} already here)" else ""}"
        }
    }

    Column(Modifier.fillMaxSize()) {
        ScreenTitle("Profile")
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth().card().padding(20.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Box(
                    Modifier.size(56.dp).background(Theme.green.copy(alpha = 0.13f), CircleShape).border(2.dp, Theme.green.copy(alpha = 0.27f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(data.userName.firstOrNull()?.uppercase() ?: "💪", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Theme.green)
                }
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    YBField(data.userName, { Store.setUserName(it) }, "Your name", Modifier.fillMaxWidth(), textColor = Color.White, fontSize = 18.sp, weight = FontWeight.Bold)
                    val n = data.workouts.size
                    Text("$n workout${if (n == 1) "" else "s"} logged", fontSize = 12.sp, color = Theme.muted)
                }
            }

            SectionLabel("Data", modifier = Modifier.padding(top = 8.dp))
            Column(Modifier.fillMaxWidth().card()) {
                ProfileRow(Icons.Filled.Delete, Theme.soft, "Recently Deleted", badge = data.recentlyDeleted.size, badgeColor = Theme.red, chevron = true) { open(ProfilePage.Deleted) }
                HorizontalDivider(color = Theme.border)
                ProfileRow(Icons.Filled.Archive, Theme.soft, "Archived Workouts", badge = data.archivedWorkouts.size, badgeColor = Theme.soft, chevron = true) { open(ProfilePage.Archived) }
            }

            SectionLabel("Data Transfer", modifier = Modifier.padding(top = 8.dp))
            Column(Modifier.fillMaxWidth().card()) {
                ProfileRow(Icons.Filled.FileUpload, Theme.green, "Export All Data", "Save a full backup (.json) — Drive, Downloads…") {
                    exportJson.launch("YeahBuddy-data-${Ymd.format(nowMs())}.json")
                }
                HorizontalDivider(color = Theme.border)
                ProfileRow(Icons.Filled.TableChart, Theme.green, "Export Workouts", "Save all workouts as CSV") {
                    exportCsv.launch("yeah-buddy-workouts-${Ymd.format(nowMs())}.csv")
                }
                HorizontalDivider(color = Theme.border)
                ProfileRow(Icons.Filled.FileDownload, Theme.soft, "Import", "iPhone data.json, a backup from here, or a workouts CSV") {
                    importer.launch(arrayOf("*/*"))
                }
            }

            message?.let {
                val ok = it.startsWith("Imported") || it.startsWith("Exported") || it.startsWith("Replaced") || it.startsWith("Merged")
                Text(it, fontSize = 12.sp, color = if (ok) Theme.green else Theme.red, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
            }

            Text("Your data is stored on this phone, kept across app updates, and included in your Android backup to your Google account.",
                fontSize = 12.sp, color = Theme.muted, modifier = Modifier.padding(top = 8.dp))
        }
    }

    pendingImport?.let { incoming ->
        val active = Store.data.activeWorkout != null
        AlertDialog(
            onDismissRequest = { pendingImport = null },
            containerColor = Theme.card2,
            title = { Text("Import data file?", color = Color.White) },
            text = {
                Text(
                    "This file has ${incoming.workouts.size} workouts, ${incoming.archivedWorkouts.size} archived and ${incoming.customExercises.size} custom exercises.\n\n" +
                        "Replace: use this file as-is (your current data is kept in a safety copy).\n" +
                        "Merge: add only what isn't here yet." +
                        if (active) "\n\nReplacing ends the workout in progress." else "",
                    color = Theme.soft, fontSize = 14.sp,
                )
            },
            confirmButton = {
                Column(horizontalAlignment = Alignment.End) {
                    TextButton(onClick = {
                        Store.replaceAll(incoming)
                        message = "Replaced — ${incoming.workouts.size} workouts loaded"
                        pendingImport = null
                    }) { Text("Replace Everything", color = Theme.green, fontWeight = FontWeight.Bold) }
                    TextButton(onClick = {
                        val added = Store.mergeAll(incoming)
                        message = "Merged — added $added workout${if (added == 1) "" else "s"}"
                        pendingImport = null
                    }) { Text("Merge", color = Theme.green) }
                    TextButton(onClick = { pendingImport = null }) { Text("Cancel", color = Theme.soft) }
                }
            },
        )
    }
}

@Composable
private fun ProfileRow(
    icon: ImageVector, iconColor: Color, title: String, subtitle: String? = null,
    badge: Int = 0, badgeColor: Color = Theme.soft, chevron: Boolean = false, onClick: () -> Unit,
) {
    Row(Modifier.fillMaxWidth().plainClick(onClick = onClick).padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Icon(icon, null, tint = iconColor, modifier = Modifier.size(20.dp).width(22.dp))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color.White)
            if (subtitle != null) Text(subtitle, fontSize = 12.sp, color = Theme.muted)
        }
        if (badge > 0) {
            Text("$badge", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = badgeColor,
                modifier = Modifier.background(badgeColor.copy(alpha = 0.13f), CircleShape).padding(horizontal = 8.dp, vertical = 2.dp))
        }
        if (chevron) Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = Theme.dim, modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun SubPage(title: String, onBack: () -> Unit, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Row(Modifier.plainClick(onClick = onBack).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Theme.green, modifier = Modifier.size(22.dp))
                Text(" Profile", fontSize = 16.sp, color = Theme.green)
            }
        }
        Text(title, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(horizontal = 16.dp))
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { content() }
    }
}

@Composable
private fun RestoreButton(onClick: () -> Unit) {
    Row(Modifier.background(Theme.green.copy(alpha = 0.13f), CircleShape).plainClick(onClick = onClick).padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(Icons.Filled.Restore, null, tint = Theme.green, modifier = Modifier.size(14.dp))
        Text("Restore", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.green)
    }
}

@Composable
private fun RecentlyDeletedView(onBack: () -> Unit) {
    SubPage("Recently Deleted", onBack) {
        val list = Store.data.recentlyDeleted
        if (list.isEmpty()) {
            EmptyState(Icons.Filled.Delete, "No recently deleted workouts")
        } else {
            Text("Workouts are permanently removed after 3 days.", fontSize = 12.sp, color = Theme.muted)
            list.forEach { w ->
                val deleted = w.deletedAt ?: nowMs()
                val daysLeft = max(0, ceil((deleted + 3 * 86_400_000L - nowMs()) / 86_400_000.0).toInt())
                Row(Modifier.fillMaxWidth().card().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(w.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        Text("${w.date} · purges in ${daysLeft}d", fontSize = 12.sp, color = Theme.red)
                    }
                    RestoreButton { Store.restoreDeleted(w.id) }
                    Text("Delete", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Theme.red,
                        modifier = Modifier.background(Theme.red.copy(alpha = 0.13f), CircleShape).plainClick { Store.permanentlyDelete(w.id) }
                            .padding(horizontal = 12.dp, vertical = 6.dp))
                }
            }
        }
    }
}

@Composable
private fun ArchivedView(onBack: () -> Unit) {
    SubPage("Archived Workouts", onBack) {
        val list = Store.data.archivedWorkouts
        if (list.isEmpty()) EmptyState(Icons.Filled.Archive, "No archived workouts")
        list.forEach { w ->
            Row(Modifier.fillMaxWidth().card().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(w.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    Text("${w.date} · ${w.exercises.size} exercises", fontSize = 12.sp, color = Theme.muted)
                }
                RestoreButton { Store.unarchive(w.id) }
            }
        }
    }
}
