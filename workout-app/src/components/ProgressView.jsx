import { useState, useMemo } from 'react'
import { Search, X, TrendingUp, Calendar, Flame, ChevronRight, ChevronDown, ChevronUp, Dumbbell, Copy, RotateCcw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useWorkoutStore } from '../store/workoutStore'
import { EXERCISES, MUSCLE_LABELS, SPLIT_LABELS } from '../data/exercises'
import { useWgerGif } from '../utils/wgerGif'
import { readEvents, clearEvents, EV } from '../utils/analytics'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-sm" style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
      <div style={{ color: '#888' }}>{label}</div>
      <div className="font-bold" style={{ color: '#22c55e' }}>{payload[0].value} lbs</div>
    </div>
  )
}

// Single exercise detail (from exercise-search tab)
function ExerciseProgressModal({ exercise, history, onClose }) {
  const data = history.map(h => ({ date: h.date.slice(5), weight: h.maxWeight }))
  const pr = Math.max(0, ...history.map(h => h.maxWeight))
  const recent = history[history.length - 1]
  const prev   = history[history.length - 2]
  const trend  = recent && prev ? recent.maxWeight - prev.maxWeight : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
        <span className="text-white font-semibold text-lg flex-1">{exercise.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: '#141414' }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#666' }}>PR</div>
            <div className="text-white font-bold text-lg">{pr > 0 ? pr : '—'}</div>
            <div className="text-xs" style={{ color: '#555' }}>lbs</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#141414' }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#666' }}>Sessions</div>
            <div className="text-white font-bold text-lg">{history.length}</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#141414' }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#666' }}>Last Change</div>
            <div className="font-bold text-lg" style={{ color: trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#888' }}>
              {trend > 0 ? `+${trend}` : trend === 0 ? '—' : trend}
            </div>
            <div className="text-xs" style={{ color: '#555' }}>lbs</div>
          </div>
        </div>

        {data.length >= 2 ? (
          <div className="rounded-2xl p-4" style={{ background: '#141414' }}>
            <div className="text-sm font-semibold text-white mb-4">Max Weight Over Time</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5}
                  dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-2xl p-8 flex flex-col items-center gap-2" style={{ background: '#141414' }}>
            <TrendingUp size={32} className="text-gray-700" />
            <span className="text-sm text-gray-600 text-center">Log at least 2 sessions to see your progress chart</span>
          </div>
        )}

        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#666' }}>Session History</div>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
            {history.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: '#555' }}>No sessions logged yet</div>
            ) : (
              [...history].reverse().map((h, i, arr) => (
                <div key={h.date + i} className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                  <div>
                    <div className="text-white text-sm font-medium">{h.date}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#555' }}>{h.sets.length} sets</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{h.maxWeight} lbs</div>
                    <div className="text-xs" style={{ color: '#555' }}>max</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Single exercise row inside a workout (with GIF thumb)
function WorkoutExerciseRow({ exercise }) {
  const gif = useWgerGif(exercise.name)
  const topSet = exercise.sets.length > 0
    ? exercise.sets.reduce((b, s) => Number(s.weight) >= Number(b.weight) ? s : b, exercise.sets[0])
    : null

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#2a2a2a' }}>
        {gif
          ? <img src={gif} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <Dumbbell size={16} color="#555" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{exercise.name}</div>
        {topSet && (
          <div className="text-xs" style={{ color: '#555' }}>
            {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
            {topSet.weight === 'BW' ? ' · BW' : topSet.weight ? ` · ${topSet.weight} lbs` : ''}
            {topSet.reps ? ` × ${topSet.reps}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// Workout summary generator (Whoop-style)
function generateSummary(workout) {
  const duration = workout.endTime ? Math.round((workout.endTime - workout.startTime) / 60000) : null
  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.length, 0)
  const totalVolume = workout.exercises.reduce((acc, e) =>
    acc + e.sets.reduce((s, set) => s + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0), 0)

  let text = `🏋️ ${workout.name || workout.split || 'Workout'} · ${workout.date}`
  if (duration) text += ` · ${duration} min`
  text += '\n\n'
  workout.exercises.forEach(ex => {
    text += `${ex.name}\n`
    ex.sets.forEach((s, i) => {
      const w = s.weight === 'BW' ? 'BW' : s.weight ? `${s.weight} lbs` : ''
      const r = s.reps ? `${s.reps} reps` : ''
      text += `  Set ${i + 1}: ${[w, r].filter(Boolean).join(' × ')}\n`
    })
  })
  text += `\nTotal: ${workout.exercises.length} exercises · ${totalSets} sets`
  if (totalVolume > 0) text += ` · ${totalVolume.toLocaleString()} lbs volume`
  text += '\n\nLogged with YEAH BUDDY 💪'
  return text
}

// Expandable workout session card
function WorkoutSessionCard({ workout }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const duration = workout.endTime ? Math.round((workout.endTime - workout.startTime) / 60000) : null
  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.length, 0)

  const handleCopySummary = (e) => {
    e.stopPropagation()
    const text = generateSummary(workout)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // fallback for Safari
      const el = document.createElement('textarea'); el.value = text
      document.body.appendChild(el); el.select(); document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#141414' }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div className="text-white font-semibold text-sm">
            {workout.name || SPLIT_LABELS[workout.split] || workout.split}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#555' }}>
            {workout.date} · {workout.exercises.length} exercises · {totalSets} sets
            {duration !== null ? ` · ${duration}m` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={handleCopySummary}
            className="px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
            style={{ background: copied ? '#22c55e22' : '#1e1e1e', color: copied ? '#22c55e' : '#555', border: '1px solid #2a2a2a' }}
          >
            <Copy size={11} />
            {copied ? 'Copied!' : 'Summary'}
          </button>
          <span style={{ color: '#444' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3" style={{ borderTop: '1px solid #1e1e1e' }}>
          {workout.exercises.map(ex => (
            <WorkoutExerciseRow key={ex.name} exercise={ex} />
          ))}
          {workout.notes ? (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1e1e1e' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#555' }}>Notes</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#888' }}>{workout.notes}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function getStreak(dates) {
  if (!dates.length) return 0
  const unique = [...new Set(dates)].sort().reverse()
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)
  for (const d of unique) {
    const day = new Date(d)
    const diff = Math.round((current - day) / 86400000)
    if (diff <= 1) { streak++; current = day } else break
  }
  return streak
}

// ── Developer UX Dashboard ───────────────────────────────────────────────────
function DevDashboard() {
  const [events, setEvents] = useState(() => readEvents())
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = () => {
    clearEvents()
    setEvents([])
    setConfirmClear(false)
  }

  const d = useMemo(() => {
    if (!events.length) return null

    const by = (type) => events.filter(e => e.type === type)
    const countBy = (type) => by(type).length

    const started   = countBy(EV.WORKOUT_STARTED)
    const finished  = countBy(EV.WORKOUT_FINISHED)
    const cancelled = countBy(EV.FINISH_CANCELLED)
    const edited    = countBy(EV.WORKOUT_EDITED)

    // Tab navigation frequency
    const tabVisits = by(EV.TAB_VISIT)
    const tabFreq = tabVisits.reduce((acc, e) => { acc[e.tab] = (acc[e.tab] || 0) + 1; return acc }, {})
    const tabTotal = tabVisits.length || 1
    const tabs = Object.entries(tabFreq).sort((a, b) => b[1] - a[1])

    // Selector efficiency: opens vs exercises added
    const selectorOpens  = countBy(EV.SELECTOR_OPENED)
    const exAdded        = countBy(EV.EXERCISE_ADDED)
    const exRemoved      = countBy(EV.EXERCISE_REMOVED)
    const exPerOpen      = selectorOpens > 0 ? (exAdded / selectorOpens).toFixed(1) : '—'
    const removalRate    = exAdded > 0 ? Math.round((exRemoved / exAdded) * 100) : 0

    // Top removed exercises (UX friction — added then removed)
    const removedFreq = by(EV.EXERCISE_REMOVED).reduce((acc, e) => {
      if (e.name) acc[e.name] = (acc[e.name] || 0) + 1
      return acc
    }, {})
    const topRemoved = Object.entries(removedFreq).sort((a, b) => b[1] - a[1]).slice(0, 3)

    // Feature adoption (relative to finished workouts)
    const timerUses   = countBy(EV.TIMER_TRIGGERED)
    const notesUses   = countBy(EV.NOTES_USED)
    const moveUpUses  = countBy(EV.MOVE_UP_TOGGLED)
    const timerPct    = finished > 0 ? Math.round((timerUses  / finished) * 100) : 0
    const notesPct    = finished > 0 ? Math.round((notesUses  / finished) * 100) : 0

    // Start method breakdown
    const startMethods = by(EV.WORKOUT_STARTED).reduce((acc, e) => {
      const via = e.via || 'unknown'
      acc[via] = (acc[via] || 0) + 1
      return acc
    }, {})

    // Time of day heatmap (workout starts)
    const hourFreq = new Array(24).fill(0)
    by(EV.WORKOUT_STARTED).forEach(e => { hourFreq[new Date(e.ts).getHours()]++ })
    const peakHour = hourFreq.indexOf(Math.max(...hourFreq))

    // Session duration from finished events
    const durations = by(EV.WORKOUT_FINISHED).filter(e => e.duration > 0).map(e => e.duration)
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null

    // Finish rate
    const finishRate = started > 0 ? Math.round((finished / started) * 100) : 0

    // Auto UX suggestions for the developer
    const suggestions = []
    if (exPerOpen !== '—' && parseFloat(exPerOpen) < 1.5 && selectorOpens >= 5)
      suggestions.push(`Exercise selector opens ${selectorOpens}x but only adds ${exPerOpen} exercises per open on avg — consider a "recents" quick-pick to reduce friction`)
    if (finishRate < 70 && started >= 3)
      suggestions.push(`Only ${finishRate}% of started workouts are finished — the other ${100 - finishRate}% may indicate UX friction or user bailing on the finish flow`)
    if (cancelled >= 2)
      suggestions.push(`Finish confirm was cancelled ${cancelled}x — the 2-tap finish flow may be adding friction; consider a single-tap finish with undo`)
    if (timerPct < 30 && finished >= 5)
      suggestions.push(`Timer triggered in only ${timerPct}% of workouts — it might not be prominent enough or users are skipping rest logging`)
    if (notesPct < 20 && finished >= 5)
      suggestions.push(`Notes used in ${notesPct}% of workouts — consider inline cue prompts or making the notes field feel more inviting`)
    if (topRemoved.length > 0 && topRemoved[0][1] >= 2)
      suggestions.push(`"${topRemoved[0][0]}" removed ${topRemoved[0][1]}x — possible naming confusion or accidental selection; check selector UX for this exercise`)
    if (removalRate > 20 && exAdded >= 5)
      suggestions.push(`${removalRate}% of added exercises get removed — high churn might mean the exercise selector is hard to browse, or users change their mind mid-workout often`)
    if (edited >= 3)
      suggestions.push(`Workouts edited ${edited}x — check if users are correcting weights/reps post-workout because the in-workout logging UX is cumbersome`)
    if (tabs.length > 0 && tabs[tabs.length - 1]?.[1] / tabTotal < 0.05)
      suggestions.push(`"${tabs[tabs.length - 1]?.[0]}" tab is visited least (${tabs[tabs.length - 1]?.[1]}x) — consider whether it deserves prime nav placement`)

    // Oldest tracked event age
    const oldest = events[0]?.ts
    const trackingAge = oldest ? Math.round((Date.now() - oldest) / 86400000) : 0

    return {
      total: events.length, trackingAge,
      started, finished, cancelled, edited, finishRate,
      tabs, tabTotal,
      selectorOpens, exAdded, exRemoved, exPerOpen, removalRate,
      topRemoved,
      timerUses, timerPct, notesPct, moveUpUses,
      startMethods,
      hourFreq, peakHour,
      avgDuration,
      suggestions,
    }
  }, [events])

  const HOUR_LABEL = (h) => h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`
  const START_METHOD_LABELS = { split_grid: 'Split tile', custom_modal: 'Custom modal', home_tile: 'Saved tile', start_again: 'Start again', unknown: 'Unknown' }

  if (!events.length) {
    return (
      <div className="px-4 py-16 flex flex-col items-center gap-3" style={{ color: '#555' }}>
        <TrendingUp size={36} strokeWidth={1.5} />
        <span className="text-sm text-center">Start using the app — events will appear here automatically.</span>
        <span className="text-xs text-center" style={{ color: '#333', maxWidth: 260 }}>Tracks tab visits, workout starts/finishes, exercise adds/removes, timer use, and more. Stored locally on this device.</span>
      </div>
    )
  }

  const StatPill = ({ label, value, accent }) => (
    <div className="rounded-2xl p-3 text-center" style={{ background: '#141414' }}>
      <div className="font-bold text-lg" style={{ color: accent || '#fff', fontFamily: 'monospace' }}>{value}</div>
      <div className="text-xs mt-0.5 leading-tight" style={{ color: '#555' }}>{label}</div>
    </div>
  )

  const Section = ({ title, children }) => (
    <div className="rounded-2xl p-4" style={{ background: '#141414' }}>
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>{title}</div>
      {children}
    </div>
  )

  const Bar = ({ pct, color = '#22c55e', dim }) => (
    <div className="flex-1 rounded-full h-1.5" style={{ background: '#1e1e1e' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: dim ? '#22c55e44' : color }} />
    </div>
  )

  return (
    <div className="px-4 flex flex-col gap-3 pb-4">
      {/* Header meta */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs" style={{ color: '#444' }}>{d.total} events · {d.trackingAge}d of data</span>
        {!confirmClear
          ? <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ color: '#555', background: '#141414' }}>
              <RotateCcw size={11} /> Reset
            </button>
          : <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#ef4444' }}>Clear all events?</span>
              <button onClick={() => setConfirmClear(false)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#888', background: '#2a2a2a' }}>No</button>
              <button onClick={handleClear} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444', background: '#ef444422' }}>Yes</button>
            </div>
        }
      </div>

      {/* Workout funnel */}
      <Section title="Workout Funnel">
        <div className="grid grid-cols-4 gap-2">
          <StatPill label="Started" value={d.started} />
          <StatPill label="Finished" value={d.finished} accent="#22c55e" />
          <StatPill label="Finish %" value={`${d.finishRate}%`} accent={d.finishRate >= 80 ? '#22c55e' : d.finishRate >= 60 ? '#f59e0b' : '#ef4444'} />
          <StatPill label="Cancelled" value={d.cancelled} accent={d.cancelled > 0 ? '#f59e0b' : '#555'} />
        </div>
        {d.avgDuration && (
          <div className="mt-3 text-xs" style={{ color: '#555' }}>Avg session duration: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{d.avgDuration} min</span></div>
        )}
      </Section>

      {/* Exercise selector efficiency */}
      <Section title="Exercise Selector Efficiency">
        <div className="grid grid-cols-4 gap-2 mb-3">
          <StatPill label="Opens" value={d.selectorOpens} />
          <StatPill label="Added" value={d.exAdded} accent="#22c55e" />
          <StatPill label="Per open" value={d.exPerOpen} accent={parseFloat(d.exPerOpen) >= 1.5 ? '#22c55e' : '#f59e0b'} />
          <StatPill label="Removed %" value={`${d.removalRate}%`} accent={d.removalRate <= 10 ? '#22c55e' : d.removalRate <= 25 ? '#f59e0b' : '#ef4444'} />
        </div>
        {d.topRemoved.length > 0 && (
          <div>
            <div className="text-xs mb-1.5" style={{ color: '#444' }}>Top removed exercises (friction signal)</div>
            {d.topRemoved.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between py-1">
                <span className="text-sm text-white truncate flex-1">{name}</span>
                <span className="text-xs ml-2 font-bold px-2 py-0.5 rounded-full" style={{ background: '#ef444422', color: '#ef4444' }}>{count}x removed</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Feature adoption */}
      <Section title="Feature Adoption">
        {[
          { label: 'Timer triggered per workout', pct: d.timerPct, value: `${d.timerPct}%`, raw: `${d.timerUses}x` },
          { label: 'Workouts with notes', pct: d.notesPct, value: `${d.notesPct}%`, raw: `${d.notesPct > 0 ? '↑' : '—'}` },
          { label: 'Ready-to-move-up used', pct: null, value: `${d.moveUpUses}x`, raw: 'total' },
          { label: 'Past workouts edited', pct: null, value: `${d.edited}x`, raw: 'total' },
        ].map(r => (
          <div key={r.label} className="flex items-center gap-3 py-1.5">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white">{r.label}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {r.pct !== null && <Bar pct={r.pct} dim={r.pct < 30} />}
              <span className="text-xs font-bold w-10 text-right" style={{ color: '#888', fontFamily: 'monospace' }}>{r.value}</span>
            </div>
          </div>
        ))}
      </Section>

      {/* Tab navigation */}
      {d.tabs.length > 0 && (
        <Section title="Tab Navigation">
          {d.tabs.map(([tab, count]) => (
            <div key={tab} className="flex items-center gap-3 py-1.5">
              <span className="text-sm text-white w-24 flex-shrink-0 capitalize">{tab}</span>
              <div className="flex-1 rounded-full h-1.5" style={{ background: '#1e1e1e' }}>
                <div className="h-full rounded-full" style={{ width: `${(count / d.tabTotal) * 100}%`, background: '#22c55e' }} />
              </div>
              <span className="text-xs font-bold w-12 text-right" style={{ color: '#888', fontFamily: 'monospace' }}>{count}x · {Math.round((count / d.tabTotal) * 100)}%</span>
            </div>
          ))}
        </Section>
      )}

      {/* Start method breakdown */}
      {Object.keys(d.startMethods).length > 0 && (
        <Section title="How Workouts Are Started">
          {Object.entries(d.startMethods).sort((a, b) => b[1] - a[1]).map(([via, count]) => (
            <div key={via} className="flex items-center gap-3 py-1.5">
              <span className="text-sm text-white flex-1">{START_METHOD_LABELS[via] || via}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 rounded-full h-1.5" style={{ background: '#1e1e1e' }}>
                  <div className="h-full rounded-full" style={{ width: `${(count / d.started) * 100}%`, background: '#22c55e' }} />
                </div>
                <span className="text-xs font-bold w-6 text-right" style={{ color: '#888', fontFamily: 'monospace' }}>{count}</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Time-of-day heatmap */}
      <Section title="Time of Day — Workout Starts">
        <div className="flex items-end gap-0.5" style={{ height: 48 }}>
          {d.hourFreq.map((count, h) => {
            const max = Math.max(...d.hourFreq, 1)
            const isActive = count > 0
            const isPeak = h === d.peakHour && count > 0
            return (
              <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-sm"
                  style={{ height: `${Math.max((count / max) * 40, isActive ? 4 : 1)}px`, background: isPeak ? '#22c55e' : isActive ? '#22c55e55' : '#1e1e1e' }} />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-1">
          {[0, 6, 12, 18, 23].map(h => (
            <span key={h} className="text-xs" style={{ color: '#444', fontSize: 9 }}>{HOUR_LABEL(h)}</span>
          ))}
        </div>
        {d.started > 0 && (
          <div className="text-xs mt-2" style={{ color: '#555' }}>Peak time: <span style={{ color: '#22c55e' }}>{HOUR_LABEL(d.peakHour)}</span></div>
        )}
      </Section>

      {/* Dev suggestions */}
      {d.suggestions.length > 0 && (
        <Section title="UX Improvement Signals">
          {d.suggestions.map((s, i) => (
            <div key={i} className="flex gap-3 py-2.5" style={{ borderBottom: i < d.suggestions.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
              <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }}>⚠</span>
              <span className="text-sm leading-relaxed" style={{ color: '#aaa' }}>{s}</span>
            </div>
          ))}
        </Section>
      )}

      <div className="text-xs text-center pb-2" style={{ color: '#2a2a2a' }}>Stored locally · only on this device</div>
    </div>
  )
}

export default function ProgressView() {
  const store = useWorkoutStore()
  const [view, setView] = useState('workouts')  // 'workouts' | 'exercises' | 'insights'
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const allExercises = useMemo(() => [...EXERCISES, ...store.customExercises], [store.customExercises])

  const exercisesWithHistory = useMemo(() =>
    allExercises
      .map(ex => ({ ex, history: store.getExerciseHistory(ex.name) }))
      .filter(({ history }) => history.length > 0)
  , [allExercises, store.workouts])

  const filteredExercises = useMemo(() => {
    const q = search.toLowerCase()
    return exercisesWithHistory.filter(({ ex }) => ex.name.toLowerCase().includes(q))
  }, [exercisesWithHistory, search])

  const filteredWorkouts = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return store.workouts
    return store.workouts.filter(w =>
      (w.name || SPLIT_LABELS[w.split] || '').toLowerCase().includes(q) ||
      w.exercises.some(e => e.name.toLowerCase().includes(q))
    )
  }, [store.workouts, search])

  const workoutDates = store.getWorkoutDates()
  const streak = getStreak(workoutDates)

  return (
    <>
      <div className="flex flex-col min-h-screen pb-24 pt-14">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-white">Progress</h1>
        </div>

        {/* Stats banner */}
        <div className="px-4 mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#141414' }}>
            <Flame size={24} style={{ color: '#f97316' }} />
            <div>
              <div className="text-2xl font-bold text-white">{streak}</div>
              <div className="text-xs" style={{ color: '#666' }}>day streak</div>
            </div>
          </div>
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#141414' }}>
            <Calendar size={24} style={{ color: '#22c55e' }} />
            <div>
              <div className="text-2xl font-bold text-white">{store.workouts.length}</div>
              <div className="text-xs" style={{ color: '#666' }}>total workouts</div>
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className="px-4 mb-3 flex gap-2">
          {[
            { id: 'workouts',  label: 'Workouts' },
            { id: 'exercises', label: 'Exercises' },
            { id: 'insights',  label: '✦ Insights' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: view === v.id ? '#22c55e' : '#141414', color: view === v.id ? '#000' : '#888' }}
            >{v.label}</button>
          ))}
        </div>

        {/* Search (hidden on insights) */}
        {view !== 'insights' && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: '#141414' }}>
              <Search size={16} className="text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder={view === 'workouts' ? 'Search workouts...' : 'Search exercises...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
              />
              {search && <button onClick={() => setSearch('')} style={{ color: '#555' }}><X size={14} /></button>}
            </div>
          </div>
        )}

        {/* ── Workouts view ── */}
        {view === 'workouts' && (
          <div className="px-4">
            {filteredWorkouts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-600">
                <TrendingUp size={36} strokeWidth={1.5} />
                <span className="text-sm text-center">
                  {store.workouts.length === 0
                    ? 'Log your first workout to see history here'
                    : 'No workouts found'}
                </span>
              </div>
            ) : (
              filteredWorkouts.map(w => (
                <WorkoutSessionCard key={w.id} workout={w} />
              ))
            )}
          </div>
        )}

        {/* ── Insights view ── */}
        {view === 'insights' && <InsightsView workouts={store.workouts} />}

        {/* ── Exercises view ── */}
        {view === 'exercises' && (
          <div className="px-4 flex flex-col gap-2">
            {filteredExercises.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-600">
                <TrendingUp size={36} strokeWidth={1.5} />
                <span className="text-sm text-center">
                  {store.workouts.length === 0 ? 'Log your first workout to see progress here' : 'No exercises found'}
                </span>
              </div>
            ) : (
              filteredExercises.map(({ ex, history }) => {
                const pr = Math.max(0, ...history.map(h => h.maxWeight))
                const trend = history.length >= 2
                  ? history[history.length - 1].maxWeight - history[history.length - 2].maxWeight
                  : null
                return (
                  <button
                    key={ex.name}
                    onClick={() => setSelected({ ex, history })}
                    className="w-full rounded-2xl px-4 py-3 flex items-center justify-between text-left active:bg-white/5"
                    style={{ background: '#141414' }}
                  >
                    <div>
                      <div className="text-white font-semibold text-sm">{ex.name}</div>
                      <div className="text-xs mt-1" style={{ color: '#555' }}>
                        {history.length} session{history.length !== 1 ? 's' : ''} · PR: {pr > 0 ? `${pr} lbs` : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend !== null && (
                        <span className="text-sm font-bold" style={{ color: trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#888' }}>
                          {trend > 0 ? `+${trend}` : trend === 0 ? '→' : trend}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-gray-700" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {selected && (
        <ExerciseProgressModal
          exercise={selected.ex}
          history={selected.history}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
