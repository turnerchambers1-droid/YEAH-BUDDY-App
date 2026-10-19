package com.turnerchambers.yeahbuddy.service

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.turnerchambers.yeahbuddy.R
import com.turnerchambers.yeahbuddy.data.Fmt
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.data.nowMs

/**
 * Android version of the iOS Live Activity: an ongoing foreground-service notification
 * with a system-driven rest countdown (ticks with the screen off) and the
 * −10/−5/−2.5/+2.5/+5/+10 weight, ±1 reps and Add Set buttons.
 */
class WorkoutService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Store.init(this)
        running = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = build(this)
        if (notification == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        try {
            ServiceCompat.startForeground(
                this, RestNotifications.ID_WORKOUT, notification,
                if (Build.VERSION.SDK_INT >= 34) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0,
            )
        } catch (e: Exception) {
            // Couldn't go foreground (e.g. started from the background): still show it.
            post(this, notification)
        }
        return START_STICKY
    }

    override fun onDestroy() {
        running = false
        super.onDestroy()
    }

    companion object {
        @Volatile var running = false
        private var lastState: Store.LiveState? = null

        /** Start / update / stop to match the store (port of LiveActivityManager.sync). */
        fun sync(context: Context) {
            val state = Store.liveState()
            val nm = context.getSystemService(NotificationManager::class.java)
            if (state == null) {
                lastState = null
                if (running) context.stopService(Intent(context, WorkoutService::class.java))
                nm.cancel(RestNotifications.ID_WORKOUT)
                return
            }
            val prev = lastState
            val newPR = state.isPR && (state.setCount != prev?.setCount || prev.isPR != true)
            if (state == prev && running) return
            lastState = state
            if (newPR && prev != null) {
                RestNotifications.postPR(context, "NEW PR! 🏆", "${state.exerciseName} — ${Fmt.weight(state.lastWeight)} × ${state.lastReps}")
            }
            if (!running) {
                try {
                    ContextCompat.startForegroundService(context, Intent(context, WorkoutService::class.java))
                } catch (_: Exception) {
                    build(context)?.let { post(context, it) }
                }
            } else {
                build(context)?.let { post(context, it) }
            }
        }

        private fun post(context: Context, n: Notification) {
            try { context.getSystemService(NotificationManager::class.java).notify(RestNotifications.ID_WORKOUT, n) } catch (_: SecurityException) {}
        }

        private fun actionIntent(context: Context, code: Int, action: String, fill: Intent.() -> Unit = {}): PendingIntent {
            val intent = Intent(context, WorkoutActionReceiver::class.java).setAction(action).apply(fill)
            return PendingIntent.getBroadcast(context, 1000 + code, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }

        private fun fill(context: Context, rv: RemoteViews, s: Store.LiveState, withControls: Boolean) {
            val now = nowMs()
            val elapsedBase = SystemClock.elapsedRealtime() - (now - s.workoutStart)
            rv.setChronometer(R.id.elapsed, elapsedBase, null, true)
            rv.setTextViewText(R.id.exercise, s.exerciseName)
            rv.setViewVisibility(R.id.pr, if (s.isPR) View.VISIBLE else View.GONE)

            val resting = s.restEnd != null && s.restEnd > now
            val lift = !resting && s.lift
            val setLine = if (s.setCount == 0) "No sets yet"
                else "Set ${s.setCount} · Last ${Fmt.weight(s.lastWeight)} × ${s.lastReps.ifEmpty { "—" }}"
            when {
                resting -> {
                    rv.setViewVisibility(R.id.rest, View.VISIBLE)
                    rv.setViewVisibility(R.id.ringLabel, View.GONE)
                    rv.setInt(R.id.ring, "setBackgroundResource", R.drawable.nb_ring)
                    rv.setChronometer(R.id.rest, SystemClock.elapsedRealtime() + (s.restEnd!! - now), null, true)
                    rv.setChronometerCountDown(R.id.rest, true)
                    rv.setTextViewText(R.id.status, setLine)
                    rv.setTextColor(R.id.status, 0xFFB3B3B3.toInt())
                }
                lift -> {
                    rv.setViewVisibility(R.id.rest, View.GONE)
                    rv.setViewVisibility(R.id.ringLabel, View.VISIBLE)
                    rv.setInt(R.id.ring, "setBackgroundResource", R.drawable.nb_ring_lift)
                    rv.setTextViewText(R.id.ringLabel, "🔥\nGO")
                    rv.setTextColor(R.id.ringLabel, 0xFFF97316.toInt())
                    rv.setTextViewText(R.id.status, "Rest over — LIFT! 💪")
                    rv.setTextColor(R.id.status, 0xFFF97316.toInt())
                }
                else -> {
                    rv.setViewVisibility(R.id.rest, View.GONE)
                    rv.setViewVisibility(R.id.ringLabel, View.VISIBLE)
                    rv.setInt(R.id.ring, "setBackgroundResource", R.drawable.nb_ring_idle)
                    rv.setTextViewText(R.id.ringLabel, "⏱")
                    rv.setTextColor(R.id.ringLabel, 0xFF22C55E.toInt())
                    rv.setTextViewText(R.id.status, setLine)
                    rv.setTextColor(R.id.status, 0xFFB3B3B3.toInt())
                }
            }

            if (!withControls) return
            rv.setTextViewText(R.id.weight, if (s.nextWeight == "BW") "BW" else if (s.nextWeight.isEmpty()) "— lbs" else "${s.nextWeight} lbs")
            rv.setTextViewText(R.id.reps, "${s.nextReps.ifEmpty { "—" }} reps")
            val weightButtons = listOf(R.id.w_m10 to -10.0, R.id.w_m5 to -5.0, R.id.w_m25 to -2.5, R.id.w_p25 to 2.5, R.id.w_p5 to 5.0, R.id.w_p10 to 10.0)
            weightButtons.forEachIndexed { i, (id, d) ->
                rv.setOnClickPendingIntent(id, actionIntent(context, i, WorkoutActionReceiver.ACTION_WEIGHT) {
                    putExtra(WorkoutActionReceiver.EXTRA_DELTA, d)
                })
            }
            rv.setOnClickPendingIntent(R.id.r_m1, actionIntent(context, 10, WorkoutActionReceiver.ACTION_REPS) { putExtra(WorkoutActionReceiver.EXTRA_DELTA_INT, -1) })
            rv.setOnClickPendingIntent(R.id.r_p1, actionIntent(context, 11, WorkoutActionReceiver.ACTION_REPS) { putExtra(WorkoutActionReceiver.EXTRA_DELTA_INT, 1) })
            rv.setOnClickPendingIntent(R.id.addSet, actionIntent(context, 12, WorkoutActionReceiver.ACTION_ADD_SET))
        }

        fun build(context: Context): Notification? {
            val s = Store.liveState() ?: return null
            val small = RemoteViews(context.packageName, R.layout.notif_small).also { fill(context, it, s, false) }
            val big = RemoteViews(context.packageName, R.layout.notif_big).also { fill(context, it, s, true) }
            val resting = s.restEnd != null && s.restEnd > nowMs()
            return NotificationCompat.Builder(context, RestNotifications.CHANNEL_WORKOUT)
                .setSmallIcon(R.drawable.ic_stat_dumbbell)
                .setColor(0xFF0A0A0A.toInt())
                .setColorized(true)
                .setContentTitle(s.exerciseName)
                .setContentText(if (resting) "Resting…" else s.workoutName)
                .setStyle(NotificationCompat.DecoratedCustomViewStyle())
                .setCustomContentView(small)
                .setCustomBigContentView(big)
                .setCustomHeadsUpContentView(small)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setShowWhen(false)
                .setCategory(NotificationCompat.CATEGORY_WORKOUT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
                .setContentIntent(RestNotifications.openAppIntent(context))
                .build()
        }
    }
}
