package com.turnerchambers.yeahbuddy.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.data.nowMs
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

/** Port of RestTimer.jsx — the vintage clock face with presets 60/90/120/180s. Auto-starts on every added set. */
@Composable
fun RestTimerView() {
    val presets = listOf(60, 90, 120, 180)
    var now by remember { mutableLongStateOf(nowMs()) }
    LaunchedEffect(Unit) { while (true) { now = nowMs(); delay(250) } }

    val duration = Store.data.restDuration
    val remaining = Store.restRemaining(now)
    val ding = Store.restFinishedAt?.let { now - it < 2500 } ?: false
    val running = Store.restRunning

    Row(
        Modifier.fillMaxWidth().card(Theme.timerBg).cardBorder(Theme.field).padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ClockFace(duration, remaining, ding,
            Modifier.size(72.dp).then(if (ding) Modifier.shadow(10.dp, CircleShape, ambientColor = Theme.green, spotColor = Theme.green) else Modifier))
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("REST TIMER", fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, letterSpacing = 1.5.sp, color = Theme.gold)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    Modifier.size(48.dp)
                        .shadow(8.dp, CircleShape, ambientColor = Theme.green.copy(alpha = 0.3f), spotColor = Theme.green.copy(alpha = 0.3f))
                        .background(if (running) Color(0xFF1A1A1A) else Theme.green, CircleShape)
                        .border(2.dp, if (running) Theme.green else Color.Transparent, CircleShape)
                        .pressable { Store.toggleRest() },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(if (running) Icons.Filled.Pause else Icons.Filled.PlayArrow, null,
                        tint = if (running) Theme.green else Color.Black, modifier = Modifier.size(24.dp))
                }
                Text("RST", fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = Theme.gold,
                    modifier = Modifier.background(Color(0xFF1A1A1A), CircleShape).border(1.dp, Color(0xFF333333), CircleShape)
                        .plainClick { Store.resetRest() }.padding(horizontal = 12.dp, vertical = 6.dp))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                presets.forEach { s ->
                    val on = duration == s
                    val label = if (s < 60) "${s}s" else if (s % 60 == 0) "${s / 60}m" else "%.1fm".format(s / 60.0)
                    Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace,
                        color = if (on) Theme.green else Theme.muted,
                        modifier = Modifier.background(if (on) Theme.green.copy(alpha = 0.13f) else Color(0xFF1A1A1A), CircleShape)
                            .border(1.dp, if (on) Theme.green.copy(alpha = 0.33f) else Color(0xFF222222), CircleShape)
                            .plainClick { Store.selectRestPreset(s) }.padding(horizontal = 10.dp, vertical = 4.dp))
                }
            }
        }
        Spacer(Modifier.weight(1f))
    }
}

/** The clock face, drawn in the web SVG's 220×220 coordinate space and scaled. */
@Composable
fun ClockFace(duration: Int, remaining: Int, ding: Boolean, modifier: Modifier = Modifier) {
    val target = if (duration > 0) (duration - remaining).toFloat() / duration else 0f
    val progress by animateFloatAsState(target.coerceIn(0f, 1f), tween(800), label = "clock")
    val measurer = rememberTextMeasurer()
    val gold = Theme.gold
    Canvas(modifier) {
        val s = size.width / 220f
        scale(s, s, pivot = Offset.Zero) {
            // Font sizes are in the 220-unit space, like the SVG.
            fun u(v: Float) = (v / density / fontScale).sp
            val c = Offset(110f, 110f)
            val r = 90f; val outer = 92f

            drawCircle(gold.copy(alpha = 0.6f), outer + 6, c, style = Stroke(3f))
            drawCircle(Brush.radialGradient(listOf(Color(0xFF1E1E1E), Color(0xFF080808)), center = Offset(88f, 77f), radius = outer * 1.2f), outer, c)
            drawCircle(Color(0xFF333333), outer, c, style = Stroke(1f))

            for (i in 0 until 60) {
                val a = Math.toRadians(i * 6.0 - 90)
                val major = i % 5 == 0
                val inner = r - (if (major) 9 else 5)
                drawLine(
                    if (major) gold else Color(0xFF555555),
                    Offset(c.x + inner * cos(a).toFloat(), c.y + inner * sin(a).toFloat()),
                    Offset(c.x + r * cos(a).toFloat(), c.y + r * sin(a).toFloat()),
                    strokeWidth = if (major) 2f else 1f, cap = StrokeCap.Round,
                )
            }

            val numStyle = TextStyle(fontSize = u(11f), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = gold)
            for ((label, deg) in listOf("12" to -90.0, "3" to 0.0, "6" to 90.0, "9" to 180.0)) {
                val a = Math.toRadians(deg); val nr = r - 16
                val m = measurer.measure(label, numStyle)
                drawText(m, topLeft = Offset(c.x + nr * cos(a).toFloat() - m.size.width / 2f, c.y + nr * sin(a).toFloat() - m.size.height / 2f))
            }

            // Remaining-time arc, starting at 12 o'clock.
            if (progress < 1f) {
                val rr = r - 4
                drawArc(Theme.green.copy(alpha = 0.85f), -90f + 360f * progress, 360f * (1 - progress), false,
                    topLeft = Offset(c.x - rr, c.y - rr), size = Size(rr * 2, rr * 2), style = Stroke(5f, cap = StrokeCap.Round))
            }

            val ha = Math.toRadians(-90.0 + progress * 360)
            drawLine(Theme.green, c, Offset(c.x + (r - 18) * cos(ha).toFloat(), c.y + (r - 18) * sin(ha).toFloat()), strokeWidth = 2.5f, cap = StrokeCap.Round)
            drawCircle(gold, 5f, c)
            drawCircle(Color(0xFF111111), 2.5f, c)

            val mm = "%02d:%02d".format(remaining / 60, remaining % 60)
            val big = measurer.measure(mm, TextStyle(fontSize = u(30f), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace,
                color = if (ding) Theme.green else Theme.text, letterSpacing = u(3f)))
            drawText(big, topLeft = Offset(c.x - big.size.width / 2f, c.y - 22 - big.size.height / 2f))
            val pct = if (duration > 0) (remaining.toDouble() / duration * 100).roundToInt() else 0
            val small = measurer.measure(if (ding) "— DONE —" else "$pct%", TextStyle(fontSize = u(11f), fontFamily = FontFamily.Monospace,
                color = Theme.muted, letterSpacing = u(1f)))
            drawText(small, topLeft = Offset(c.x - small.size.width / 2f, c.y + 14 - small.size.height / 2f))
        }
    }
}
