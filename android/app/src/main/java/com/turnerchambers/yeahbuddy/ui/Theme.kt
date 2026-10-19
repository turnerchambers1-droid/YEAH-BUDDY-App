package com.turnerchambers.yeahbuddy.ui

import android.view.WindowManager
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider

/** Colours lifted straight from the web app's inline styles (same as iOS Theme). */
object Theme {
    val bg = Color(0xFF0A0A0A)
    val card = Color(0xFF141414)
    val card2 = Color(0xFF1A1A1A)
    val raised = Color(0xFF1E1E1E)
    val field = Color(0xFF2A2A2A)
    val border = Color(0xFF1E1E1E)
    val timerBg = Color(0xFF0D0D0D)

    val green = Color(0xFF22C55E)
    val gold = Color(0xFFC8B97A)
    val cyan = Color(0xFF00D4FF)
    val red = Color(0xFFEF4444)
    val orange = Color(0xFFF97316)
    val teal = Color(0xFF99F6E4)

    val text = Color(0xFFF5F5F5)
    val muted = Color(0xFF555555)
    val dim = Color(0xFF444444)
    val soft = Color(0xFF888888)

    fun equipColor(tag: String): Color = when (tag) {
        "BB" -> Color(0xFFF59E0B)
        "Camber" -> Color(0xFFFB923C)
        "Hex", "HB" -> Color(0xFFEAB308)
        "Smith" -> Color(0xFF818CF8)
        "DB" -> Color(0xFF3B82F6)
        "KB" -> Color(0xFFA78BFA)
        "Cable", "MAG" -> orange
        "Machine", "SA", "DA" -> Color(0xFF22D3EE)
        "BW" -> green
        "EZ" -> Color(0xFFF43F5E)
        "Plate", "SL" -> Color(0xFF84CC16)
        "Other" -> Color(0xFF9CA3AF)
        else -> soft
    }
}

@Composable
fun YBTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Theme.green,
            onPrimary = Color.Black,
            secondary = Theme.gold,
            background = Theme.bg,
            surface = Theme.card,
            surfaceVariant = Theme.raised,
            onBackground = Theme.text,
            onSurface = Theme.text,
            onSurfaceVariant = Theme.soft,
            error = Theme.red,
            surfaceContainerHigh = Theme.card2,
            surfaceContainer = Theme.card,
            outline = Theme.field,
        ),
        content = content,
    )
}

// region Modifiers

fun Modifier.card(color: Color = Theme.card, radius: Dp = 16.dp): Modifier =
    this.clip(RoundedCornerShape(radius)).background(color)

fun Modifier.cardBorder(color: Color, radius: Dp = 16.dp, width: Dp = 1.dp): Modifier =
    this.border(BorderStroke(width, color), RoundedCornerShape(radius))

fun Modifier.dashedBorder(color: Color, radius: Dp = 16.dp, dash: Float = 5f, gap: Float = 4f): Modifier =
    this.drawBehind {
        val r = radius.toPx()
        drawRoundRect(
            color = color,
            cornerRadius = CornerRadius(r, r),
            style = Stroke(width = 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(dash.dp.toPx(), gap.dp.toPx()))),
        )
    }

/** Plain click with no ripple (iOS `.buttonStyle(.plain)` feel). */
fun Modifier.plainClick(enabled: Boolean = true, onClick: () -> Unit): Modifier = this.then(
    Modifier.clickable(enabled = enabled, interactionSource = null, indication = null, onClick = onClick)
)

/** Press-to-shrink (iOS PressableStyle). */
@Composable
fun Modifier.pressable(onClick: () -> Unit): Modifier {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    return this.scale(if (pressed) 0.96f else 1f).clickable(interactionSource = source, indication = null, onClick = onClick)
}

// endregion
// region Small shared pieces

@Composable
fun SectionLabel(text: String, color: Color = Theme.muted, modifier: Modifier = Modifier) {
    Text(
        text.uppercase(),
        fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp, color = color,
        modifier = modifier.fillMaxWidth(),
    )
}

@Composable
fun Tag(text: String, color: Color) {
    Text(
        text, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color, maxLines = 1,
        modifier = Modifier
            .clip(RoundedCornerShape(5.dp))
            .background(color.copy(alpha = 0.13f))
            .border(1.dp, color.copy(alpha = 0.33f), RoundedCornerShape(5.dp))
            .padding(horizontal = 6.dp, vertical = 1.dp),
    )
}

@Composable
fun Pill(text: String, selected: Boolean, color: Color = Theme.green, onClick: () -> Unit) {
    Text(
        text, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
        color = if (selected) color else Theme.soft,
        modifier = Modifier
            .clip(CircleShape)
            .background(if (selected) color.copy(alpha = 0.13f) else Theme.field)
            .border(1.dp, if (selected) color.copy(alpha = 0.27f) else Color.Transparent, CircleShape)
            .plainClick(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

@Composable
fun ChipButton(label: String, onClick: () -> Unit) {
    Text(
        label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Theme.green,
        modifier = Modifier
            .clip(CircleShape)
            .background(Theme.green.copy(alpha = 0.13f))
            .border(1.dp, Theme.green.copy(alpha = 0.27f), CircleShape)
            .plainClick(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 5.dp),
    )
}

@Composable
fun EmptyState(icon: ImageVector, text: String, modifier: Modifier = Modifier) {
    Column(
        modifier.fillMaxWidth().padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(icon, null, tint = Theme.muted, modifier = Modifier.size(34.dp))
        Text(text, fontSize = 14.sp, color = Theme.muted, textAlign = TextAlign.Center)
    }
}

@Composable
fun IconLabel(icon: ImageVector, text: String, color: Color, fontSize: TextUnit = 14.sp, weight: FontWeight = FontWeight.SemiBold, iconSize: Dp = 16.dp) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Icon(icon, null, tint = color, modifier = Modifier.size(iconSize))
        Text(text, fontSize = fontSize, fontWeight = weight, color = color)
    }
}

/**
 * Styled text field. [center] mimics the web inputs (dark field, centered bold text).
 */
@Composable
fun YBField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    textColor: Color = Theme.text,
    fontSize: TextUnit = 16.sp,
    weight: FontWeight = FontWeight.Normal,
    center: Boolean = false,
    singleLine: Boolean = true,
    minLines: Int = 1,
    maxLines: Int = if (singleLine) 1 else Int.MAX_VALUE,
    keyboard: KeyboardOptions = KeyboardOptions.Default,
    actions: KeyboardActions = KeyboardActions.Default,
    mono: Boolean = false,
    trailing: (@Composable () -> Unit)? = null,
) {
    val style = TextStyle(
        color = textColor, fontSize = fontSize, fontWeight = weight,
        textAlign = if (center) TextAlign.Center else TextAlign.Start,
        fontFamily = if (mono) FontFamily.Monospace else FontFamily.Default,
    )
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        textStyle = style,
        singleLine = singleLine,
        minLines = minLines,
        maxLines = maxLines,
        keyboardOptions = keyboard,
        keyboardActions = actions,
        cursorBrush = SolidColor(Theme.green),
        decorationBox = { inner ->
            Box(contentAlignment = if (center) Alignment.Center else Alignment.CenterStart) {
                if (value.isEmpty()) Text(placeholder, style = style.copy(color = Theme.muted, fontWeight = FontWeight.Normal))
                inner()
                if (trailing != null) Box(Modifier.align(Alignment.CenterEnd)) { trailing() }
            }
        },
    )
}

/** Search bar used where iOS has `.searchable`. */
@Composable
fun SearchField(value: String, onValueChange: (String) -> Unit, placeholder: String, modifier: Modifier = Modifier) {
    Row(
        modifier.fillMaxWidth().card(Theme.raised, 10.dp).padding(horizontal = 10.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Filled.Search, null, tint = Theme.soft, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp))
        YBField(value, onValueChange, placeholder, Modifier.weight(1f), fontSize = 15.sp)
        if (value.isNotEmpty()) {
            Icon(Icons.Filled.Close, "Clear", tint = Theme.soft, modifier = Modifier.size(18.dp).plainClick { onValueChange("") })
        }
    }
}

@Composable
fun ScreenTitle(title: String, modifier: Modifier = Modifier, trailing: @Composable RowScope.() -> Unit = {}) {
    Row(modifier.fillMaxWidth().padding(start = 16.dp, end = 8.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(title, fontSize = 32.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.weight(1f))
        trailing()
    }
}

/**
 * Full-screen sheet (the iOS `.sheet` + NavigationStack with an X and a confirm button).
 */
@Composable
fun Sheet(
    title: String,
    onDismiss: () -> Unit,
    confirmLabel: String? = null,
    confirmEnabled: Boolean = true,
    onConfirm: () -> Unit = {},
    onClose: () -> Unit = onDismiss,
    content: @Composable ColumnScope.() -> Unit,
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false),
    ) {
        val window = (LocalView.current.parent as? DialogWindowProvider)?.window
        remember(window) {
            window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
            window?.setDimAmount(0f)
            // Draw under the status bar so the screen behind doesn't show through.
            window?.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
            0
        }
        Column(Modifier.fillMaxSize().background(Theme.bg).statusBarsPadding().navigationBarsPadding().imePadding()) {
            Row(Modifier.fillMaxWidth().height(52.dp).padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(44.dp).plainClick(onClick = onClose), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Close, "Close", tint = Theme.green, modifier = Modifier.size(22.dp))
                }
                Text(title, fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = Color.White, maxLines = 1,
                    textAlign = TextAlign.Center, modifier = Modifier.weight(1f))
                Box(Modifier.width(64.dp), contentAlignment = Alignment.CenterEnd) {
                    if (confirmLabel != null) {
                        Text(confirmLabel, fontSize = 16.sp, fontWeight = FontWeight.Bold,
                            color = if (confirmEnabled) Theme.green else Theme.muted,
                            modifier = Modifier.plainClick(enabled = confirmEnabled, onClick = onConfirm).padding(8.dp))
                    }
                }
            }
            content()
        }
    }
}

// endregion
