import { useState, useMemo } from 'react'
import { Search, X, TrendingUp, Calendar, Flame, ChevronRight, ChevronDown, ChevronUp, Dumbbell, Copy } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useWorkoutStore } from '../store/workoutStore'
import { EXERCISES, MUSCLE_LABELS, SPLIT_LABELS, getExerciseMeta } from '../data/exercises'
import { useWgerGif } from '../utils/wgerGif'
import ExerciseLabel from './ExerciseLabel'

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
        <span className="flex-1"><ExerciseLabel name={exercise.name} textClassName="text-white font-semibold text-lg" /></span>
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
        <ExerciseLabel name={exercise.name} small textClassName="text-white text-sm font-medium truncate" />
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
    const meta = getExerciseMeta(ex.name)
    const tags = [meta.equipment, meta.unilateral ? 'SA' : null].filter(Boolean).join(', ')
    text += `${meta.displayName || meta.name}${tags ? ` (${tags})` : ''}\n`
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

export default function ProgressView() {
  const store = useWorkoutStore()
  const [view, setView] = useState('workouts')  // 'workouts' | 'exercises'
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
          <button
            onClick={() => setView('workouts')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: view === 'workouts' ? '#22c55e' : '#141414', color: view === 'workouts' ? '#000' : '#888' }}
          >Workouts</button>
          <button
            onClick={() => setView('exercises')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: view === 'exercises' ? '#22c55e' : '#141414', color: view === 'exercises' ? '#000' : '#888' }}
          >Exercises</button>
        </div>

        {/* Search */}
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
                      <ExerciseLabel name={ex.name} small textClassName="text-white font-semibold text-sm" />
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
