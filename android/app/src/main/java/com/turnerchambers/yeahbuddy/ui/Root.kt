package com.turnerchambers.yeahbuddy.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.MainActivity
import com.turnerchambers.yeahbuddy.data.AppTab
import com.turnerchambers.yeahbuddy.data.Store

@Composable
fun RootView() {
    YBTheme {
        val context = LocalContext.current
        val active = Store.data.activeWorkout != null
        LaunchedEffect(active) {
            if (active) (context as? MainActivity)?.requestNotificationPermission()
        }
        Column(Modifier.fillMaxSize().background(Theme.bg)) {
            Box(Modifier.weight(1f).fillMaxWidth().statusBarsPadding()) {
                when (Store.selectedTab) {
                    AppTab.Workout -> WorkoutView()
                    AppTab.Library -> LibraryView()
                    AppTab.Progress -> ProgressScreen()
                    AppTab.Profile -> ProfileView()
                }
            }
            HorizontalDivider(color = Color(0xFF1E1E1E), thickness = 0.5.dp)
            NavigationBar(containerColor = Color(0xFF0F0F0F), tonalElevation = 0.dp) {
                val items = listOf(
                    Triple(AppTab.Workout, "Workout", Icons.Filled.FitnessCenter),
                    Triple(AppTab.Library, "Exercises", Icons.AutoMirrored.Filled.MenuBook),
                    Triple(AppTab.Progress, "Progress", Icons.AutoMirrored.Filled.ShowChart),
                    Triple(AppTab.Profile, "Profile", Icons.Filled.Person),
                )
                for ((tab, label, icon) in items) {
                    NavigationBarItem(
                        selected = Store.selectedTab == tab,
                        onClick = { Store.selectedTab = tab },
                        icon = { Icon(icon, label) },
                        label = { Text(label, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Theme.green,
                            selectedTextColor = Theme.green,
                            indicatorColor = Theme.green.copy(alpha = 0.13f),
                            unselectedIconColor = Theme.soft,
                            unselectedTextColor = Theme.soft,
                        ),
                    )
                }
            }
        }
    }
}
