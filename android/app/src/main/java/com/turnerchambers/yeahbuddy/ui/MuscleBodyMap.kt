package com.turnerchambers.yeahbuddy.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.min

private val frontIds = setOf("chest", "front_delt", "side_delt", "biceps", "forearms", "abs", "quads", "calves", "adductors", "abductors")
private val backIds = setOf("traps", "lats", "mid_back", "lower_back", "rear_delt", "triceps", "glutes", "hamstrings", "calves")

private val pathCache = HashMap<String, Path>()
private fun svgPath(d: String): Path = pathCache.getOrPut(d) { PathParser().parsePathString(d).toPath() }

/** Front + back body figures; primary muscles green, secondary teal. */
@Composable
fun MuscleBodyMap(primary: List<String>, secondary: List<String>, compact: Boolean = false, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth().height(if (compact) 250.dp else 320.dp), horizontalArrangement = Arrangement.spacedBy(if (compact) 8.dp else 24.dp)) {
        BodyFigure(MuscleMapData.front, MuscleMapData.frontLines, "FRONT", primary.filter { it in frontIds }, secondary.filter { it in frontIds }, Modifier.weight(1f))
        BodyFigure(MuscleMapData.back, MuscleMapData.backLines, "BACK", primary.filter { it in backIds }, secondary.filter { it in backIds }, Modifier.weight(1f))
    }
}

@Composable
private fun BodyFigure(parts: List<Pair<String, String>>, lines: List<FloatArray>, label: String, primary: List<String>, secondary: List<String>, modifier: Modifier) {
    val measurer = rememberTextMeasurer()
    Canvas(modifier.fillMaxHeight()) {
        val scale = min(size.width / 200f, size.height / 450f)
        translate(left = (size.width - 200 * scale) / 2) {
            withTransform({ scale(scale, scale, pivot = Offset.Zero) }) {
                val skin = Color(0xFF1C1C1C); val edge = Color(0xFF3A3A3A)
                drawOval(skin, Offset(82f, 5f), Size(36f, 42f))
                drawOval(edge, Offset(82f, 5f), Size(36f, 42f), style = Stroke(1.2f))
                for (d in MuscleMapData.silhouette) {
                    val p = svgPath(d)
                    drawPath(p, skin)
                    drawPath(p, edge, style = Stroke(1.2f))
                }
                for ((muscle, d) in parts) {
                    val color = if (muscle in primary) Theme.green else if (muscle in secondary) Theme.teal else Theme.field
                    drawPath(svgPath(d), color.copy(alpha = 0.9f))
                }
                for (l in lines) {
                    drawLine(Color(0xFF2E2E2E).copy(alpha = 0.6f), Offset(l[0], l[1]), Offset(l[2], l[3]), strokeWidth = 1.2f)
                }
                val unit = (9f / density / fontScale).sp
                val t = measurer.measure(label, TextStyle(fontSize = unit, fontWeight = FontWeight.Bold, letterSpacing = (3f / density / fontScale).sp, color = Theme.dim))
                drawText(t, topLeft = Offset(100f - t.size.width / 2f, 444f - t.size.height / 2f))
            }
        }
    }
}
