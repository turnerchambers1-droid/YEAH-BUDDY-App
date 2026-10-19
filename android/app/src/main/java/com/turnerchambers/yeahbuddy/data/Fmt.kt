package com.turnerchambers.yeahbuddy.data

import kotlin.math.abs
import kotlin.math.roundToLong

/** Weight/rep step values offered on the workout notification (taken from the web app's chips). */
object LiveSteps {
    val weight = listOf(-10.0, -5.0, -2.5, 2.5, 5.0, 10.0)
    val reps = listOf(-1, 1)
}

object Fmt {
    /** "BW", "135 lbs", or "—". */
    fun weight(w: String): String = if (w == "BW") "BW" else if (w.isEmpty()) "—" else "$w lbs"

    fun number(d: Double): String =
        if (d == Math.rint(d) && abs(d) < 1e15) d.roundToLong().toString()
        else d.toBigDecimal().stripTrailingZeros().toPlainString()

    fun value(w: String): Double = w.toDoubleOrNull() ?: 0.0

    fun step(d: Double): String = (if (d > 0) "+" else "−") + number(abs(d))
}
