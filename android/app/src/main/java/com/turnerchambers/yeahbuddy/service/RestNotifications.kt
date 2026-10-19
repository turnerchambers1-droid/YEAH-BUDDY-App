package com.turnerchambers.yeahbuddy.service

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.turnerchambers.yeahbuddy.MainActivity
import com.turnerchambers.yeahbuddy.R
import com.turnerchambers.yeahbuddy.data.Store
import kotlin.math.roundToInt

/**
 * The rest-over alert is scheduled with AlarmManager when the timer starts, so it fires
 * with sound + vibration even if the app is in the background or the screen is off.
 */
object RestNotifications {
    const val CHANNEL_WORKOUT = "workout"
    const val CHANNEL_REST = "rest-v1"
    const val CHANNEL_PR = "pr"
    const val ID_WORKOUT = 1
    const val ID_REST = 2
    const val ID_PR = 3
    const val EXTRA_OPEN_EXERCISE = "openExercise"
    private const val REQ_ALARM = 100

    fun createChannels(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_WORKOUT, "Workout in progress", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Rest timer and next-set controls while a workout is running"
                setShowBadge(false)
            }
        )
        val sound = Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${context.packageName}/${R.raw.lunk}")
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_REST, "Rest timer done", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Alerts when your rest is over"
                setSound(sound, AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 200, 250)
            }
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_PR, "Personal records", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "When a set beats your best"
            }
        )
    }

    fun openAppIntent(context: Context, requestCode: Int = 0): PendingIntent {
        val intent = Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            .putExtra(EXTRA_OPEN_EXERCISE, true)
        return PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun alarmIntent(context: Context, duration: Int = 0): PendingIntent =
        PendingIntent.getBroadcast(
            context, REQ_ALARM,
            Intent(context, RestAlarmReceiver::class.java).putExtra("duration", duration),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    fun schedule(context: Context, endMs: Long, duration: Int) {
        val am = context.getSystemService(AlarmManager::class.java)
        val pi = alarmIntent(context, duration)
        am.cancel(pi)
        cancelDelivered(context)
        val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
        try {
            if (canExact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endMs, pi)
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endMs, pi)
        } catch (_: SecurityException) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endMs, pi)
        }
    }

    fun cancel(context: Context) {
        context.getSystemService(AlarmManager::class.java).cancel(alarmIntent(context))
        cancelDelivered(context)
    }

    private fun cancelDelivered(context: Context) {
        context.getSystemService(NotificationManager::class.java).cancel(ID_REST)
    }

    fun postRestDone(context: Context, duration: Int) {
        val length = if (duration >= 60) "${(duration / 60.0).roundToInt()}m" else "${duration}s"
        val n = NotificationCompat.Builder(context, CHANNEL_REST)
            .setSmallIcon(R.drawable.ic_stat_dumbbell)
            .setColor(0xFF22C55E.toInt())
            .setContentTitle("Rest over — back to work! 💪")
            .setContentText("$length rest complete — time to lift!")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setTimeoutAfter(5 * 60 * 1000)
            .setContentIntent(openAppIntent(context, 1))
            .build()
        try { context.getSystemService(NotificationManager::class.java).notify(ID_REST, n) } catch (_: SecurityException) {}
    }

    fun postPR(context: Context, title: String, body: String) {
        val n = NotificationCompat.Builder(context, CHANNEL_PR)
            .setSmallIcon(R.drawable.ic_stat_dumbbell)
            .setColor(0xFFC8B97A.toInt())
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setTimeoutAfter(15_000)
            .setContentIntent(openAppIntent(context, 2))
            .build()
        try { context.getSystemService(NotificationManager::class.java).notify(ID_PR, n) } catch (_: SecurityException) {}
    }
}

/** Fires at the end of the rest period. */
class RestAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Store.init(context)
        RestNotifications.postRestDone(context, intent.getIntExtra("duration", Store.data.restDuration))
        Store.finishRest()
        Store.saveNow()
        Store.syncNotification()
    }
}

/** Buttons on the workout notification (the Android version of the Live Activity intents). */
class WorkoutActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Store.init(context)
        when (intent.action) {
            ACTION_WEIGHT -> Store.liveAdjustWeight(intent.getDoubleExtra(EXTRA_DELTA, 0.0))
            ACTION_REPS -> Store.liveAdjustReps(intent.getIntExtra(EXTRA_DELTA_INT, 0))
            ACTION_ADD_SET -> Store.liveAddSet()
        }
    }

    companion object {
        const val ACTION_WEIGHT = "com.turnerchambers.yeahbuddy.WEIGHT"
        const val ACTION_REPS = "com.turnerchambers.yeahbuddy.REPS"
        const val ACTION_ADD_SET = "com.turnerchambers.yeahbuddy.ADD_SET"
        const val EXTRA_DELTA = "delta"
        const val EXTRA_DELTA_INT = "deltaInt"
    }
}
