import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Timer, Trash2, ChevronDown, ChevronUp, ArrowUpCircle, X, Pencil } from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { SPLIT_LABELS, EXERCISES } from '../data/exercises'
import ExerciseSelector from './ExerciseSelector'
import RestTimer from './RestTimer'

// ── Set row ────────────────────────────────────────────────────────────────
function SetRow({ set, index, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs font-bold w-5 text-center" style={{ color: '#555' }}>{index + 1}</span>
      <div className="flex-1 flex gap-2">
        <div className="flex-1 relative">
          <input type="number" placeholder="lbs" value={set.weight || ''} onChange={e => onUpdate('weight', e.target.value)}
            className="w-full text-center rounded-lg py-2 text-sm font-semibold outline-none text-white" style={{ background: '#2a2a2a' }} />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#444' }}>lbs</span>
        </div>
        <div className="flex-1 relative">
          <input type="number" placeholder="reps" value={set.reps || ''} onChange={e => onUpdate('reps', e.target.value)}
            className="w-full text-center rounded-lg py-2 text-sm font-semibold outline-none text-white" style={{ background: '#2a2a2a' }} />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#444' }}>reps</span>
        </div>
      </div>
      <button onClick={onRemove} className="p-1.5 rounded-lg" style={{ color: '#555' }}><Trash2 size={15} /></button>
    </div>
  )
}

// ── Exercise card ──────────────────────────────────────────────────────────
function ExerciseCard({ exercise, onAddSet, onUpdateSet, onRemoveSet, onToggleMoveUp, onRemove, pr }) {
  const [expanded, setExpanded] = useState(true)
  const maxWeight = exercise.sets.length > 0 ? Math.max(...exercise.sets.map(s => Number(s.weight) || 0)) : 0
  const isPR = maxWeight > 0 && maxWeight > pr

  return (
    <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#141414' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <button className="flex-1 flex items-center gap-2 text-left" onClick={() => setExpanded(e => !e)}>
          <span className="text-white font-semibold text-sm">{exercise.name}</span>
          {isPR && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#22c55e22', color: '#22c55e' }}>PR!</span>}
          {exercise.sets.length > 0 && <span className="text-xs" style={{ color: '#555' }}>{exercise.sets.length} set{exercise.sets.length > 1 ? 's' : ''}</span>}
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => onToggleMoveUp(exercise.name)} title="Ready to move up in weight"
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: exercise.readyToMoveUp ? '#00d4ff22' : 'transparent', color: exercise.readyToMoveUp ? '#00d4ff' : '#444' }}>
            <ArrowUpCircle size={18} />
          </button>
          <button onClick={() => onRemove(exercise.name)} className="p-1.5" style={{ color: '#444' }}><X size={16} /></button>
          <button onClick={() => setExpanded(e => !e)} style={{ color: '#444' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>
      {exercise.readyToMoveUp && (
        <div className="mx-4 mb-2 px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: '#00d4ff11', border: '1px solid #00d4ff33' }}>
          <ArrowUpCircle size={14} style={{ color: '#00d4ff' }} />
          <span className="text-xs font-semibold" style={{ color: '#00d4ff' }}>Ready to increase weight next session</span>
        </div>
      )}
      {expanded && (
        <div className="px-4 pb-3">
          {exercise.sets.length > 0 && (
            <div className="flex gap-2 mb-1">
              <div className="w-5" />
              <div className="flex-1 text-center text-xs font-semibold" style={{ color: '#555' }}>WEIGHT</div>
              <div className="flex-1 text-center text-xs font-semibold" style={{ color: '#555' }}>REPS</div>
              <div className="w-8" />
            </div>
          )}
          {exercise.sets.map((set, i) => (
            <SetRow key={set.id} set={set} index={i}
              onUpdate={(field, val) => onUpdateSet(exercise.name, set.id, field, val)}
              onRemove={() => onRemoveSet(exercise.name, set.id)} />
          ))}
          <button onClick={() => { const last = exercise.sets[exercise.sets.length - 1]; onAddSet(exercise.name, { weight: last?.weight || '', reps: last?.reps || '' }) }}
            className="w-full mt-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            style={{ background: '#1e1e1e', color: '#00d4ff' }}>
            <Plus size={15} /> Add Set
          </button>
        </div>
      )}
    </div>
  )
}

// ── Long-press + swipe delete hook ────────────────────────────────────────
function useDeleteGestures(onLongPress, onSwipeDelete) {
  const pressTimer = useRef(null)
  const startX     = useRef(null)
  const [swiped, setSwiped] = useState(false)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    setSwiped(false)
    pressTimer.current = setTimeout(() => { onLongPress() }, 500)
  }, [onLongPress])

  const onTouchMove = useCallback((e) => {
    clearTimeout(pressTimer.current)
    if (startX.current !== null) {
      const dx = startX.current - e.touches[0].clientX
      if (dx > 60) setSwiped(true)
      else if (dx < 0) setSwiped(false)
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    clearTimeout(pressTimer.current)
  }, [])

  return { swiped, setSwiped, handlers: { onTouchStart, onTouchMove, onTouchEnd } }
}

// ── Recent workout card with delete gestures ──────────────────────────────
function WorkoutCard({ workout, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { swiped, setSwiped, handlers } = useDeleteGestures(
    () => setConfirmDelete(true),
    () => setConfirmDelete(true),
  )

  const duration = workout.endTime
    ? Math.round((workout.endTime - workout.startTime) / 60000)
    : null

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl" {...handlers}>
        {/* Swipe-reveal delete button */}
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center px-5 rounded-r-2xl transition-all"
          style={{ background: '#ef4444', transform: swiped ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.2s' }}
        >
          <button onClick={() => setConfirmDelete(true)}><Trash2 size={20} color="white" /></button>
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl transition-transform"
          style={{ background: '#141414', transform: swiped ? 'translateX(-72px)' : 'translateX(0)', transition: 'transform 0.2s' }}
        >
          <div>
            <div className="text-white font-semibold text-sm">
              {workout.name || SPLIT_LABELS[workout.split] || workout.split}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#555' }}>
              {workout.date} · {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {duration !== null && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#00d4ff11', color: '#00d4ff' }}>{duration}m</span>
            )}
            {swiped && (
              <button onClick={() => setSwiped(false)} style={{ color: '#555' }}><X size={14} /></button>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
            <h2 className="text-white font-bold text-lg">Delete workout?</h2>
            <p className="text-sm" style={{ color: '#888' }}>
              {workout.name || SPLIT_LABELS[workout.split] || workout.split} on {workout.date}. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmDelete(false); setSwiped(false) }}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#2a2a2a', color: '#888' }}>Cancel</button>
              <button onClick={() => { onDelete(workout.id); setConfirmDelete(false) }}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#ef4444', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Custom workout modal ───────────────────────────────────────────────────
function CustomWorkoutModal({ onStart, onClose }) {
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises]     = useState([])
  const [showSelector, setShowSelector] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
          <span className="text-white font-semibold text-lg flex-1">Custom Workout</span>
          <button
            onClick={() => { if (workoutName.trim()) onStart(workoutName.trim(), exercises) }}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: workoutName.trim() ? '#00d4ff' : '#1e1e1e', color: workoutName.trim() ? '#000' : '#555' }}
          >Start</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#555' }}>Workout Name</label>
            <input autoFocus type="text" placeholder='e.g. "Pull Day", "Leg Blast"'
              value={workoutName} onChange={e => setWorkoutName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none" style={{ background: '#141414' }} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#555' }}>
              Exercises ({exercises.length})
            </label>
            {exercises.length > 0 && (
              <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#141414' }}>
                {exercises.map((name, i) => (
                  <div key={name} className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: i < exercises.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                    <span className="text-white text-sm">{name}</span>
                    <button onClick={() => setExercises(e => e.filter(x => x !== name))} style={{ color: '#555' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowSelector(true)}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
              style={{ background: '#141414', color: '#00d4ff', border: '1px dashed #1e1e1e' }}>
              <Plus size={18} /> Add Exercise
            </button>
          </div>
        </div>
      </div>

      {showSelector && (
        <ExerciseSelector
          currentExercises={exercises}
          onSelect={name => setExercises(e => [...e, name])}
          onClose={() => setShowSelector(false)}
        />
      )}
    </>
  )
}

// ── Main WorkoutLogger ─────────────────────────────────────────────────────
export default function WorkoutLogger() {
  const store = useWorkoutStore()
  const [showSelector,      setShowSelector]      = useState(false)
  const [showTimer,         setShowTimer]          = useState(false)
  const [showFinishConfirm, setShowFinishConfirm]  = useState(false)
  const [showCustomModal,   setShowCustomModal]    = useState(false)
  const [elapsed,           setElapsed]            = useState(0)

  useEffect(() => {
    if (!store.activeWorkout) return
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - store.activeWorkout.startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [store.activeWorkout])

  const fmt = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const handleStartCustom = (name, exerciseNames) => {
    store.startWorkout('custom', name)
    exerciseNames.forEach(ex => store.addExerciseToWorkout(ex))
    setShowCustomModal(false)
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!store.activeWorkout) {
    return (
      <>
        <div className="flex flex-col min-h-screen pb-24 pt-14">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Start Workout</h1>
              <p className="text-sm mt-0.5" style={{ color: '#555' }}>
                {store.currentUser ? `Hey ${store.currentUser} 👋` : 'Choose your split'}
              </p>
            </div>
          </div>

          {/* Split quick-start grid */}
          <div className="px-4 mt-3 grid grid-cols-2 gap-3">
            {Object.entries(SPLIT_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => store.startWorkout(key)}
                className="rounded-2xl p-5 text-left active:scale-95 transition-transform"
                style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
                <div className="text-white font-bold text-base">{label}</div>
                <div className="text-xs mt-1" style={{ color: '#555' }}>Tap to start</div>
              </button>
            ))}
          </div>

          {/* Recent workouts */}
          {store.workouts.length > 0 && (
            <div className="px-4 mt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Recent — long press or swipe left to delete</h2>
              <div className="flex flex-col gap-2">
                {store.workouts.slice(0, 5).map(w => (
                  <WorkoutCard key={w.id} workout={w} onDelete={store.deleteWorkout} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom workout FAB */}
        <button
          onClick={() => setShowCustomModal(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ background: '#00d4ff', boxShadow: '0 4px 24px #00d4ff55' }}
        >
          <Pencil size={22} color="#000" />
        </button>

        {showCustomModal && (
          <CustomWorkoutModal onStart={handleStartCustom} onClose={() => setShowCustomModal(false)} />
        )}
      </>
    )
  }

  // ── Active workout screen ─────────────────────────────────────────────────
  const { activeWorkout } = store
  const workoutTitle = activeWorkout.name || SPLIT_LABELS[activeWorkout.split] || activeWorkout.split

  return (
    <>
      <div className="flex flex-col min-h-screen pb-28 pt-14">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #141414' }}>
          <div>
            <div className="text-white font-bold text-lg">{workoutTitle}</div>
            <div className="text-sm font-mono" style={{ color: '#00d4ff' }}>{fmt(elapsed)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTimer(true)} className="p-2.5 rounded-xl" style={{ background: '#1e1e1e', color: '#888' }}>
              <Timer size={20} />
            </button>
            <button onClick={() => setShowFinishConfirm(true)} className="px-4 py-2.5 rounded-xl font-semibold text-sm text-black" style={{ background: '#00d4ff' }}>
              Finish
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pt-4">
          {activeWorkout.exercises.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
              <Plus size={40} strokeWidth={1.5} />
              <span className="text-sm">Tap below to add your first exercise</span>
            </div>
          )}
          {activeWorkout.exercises.map(ex => (
            <ExerciseCard key={ex.name} exercise={ex}
              pr={store.getPersonalRecord(ex.name)}
              onAddSet={store.addSet}
              onUpdateSet={store.updateSet}
              onRemoveSet={store.removeSet}
              onToggleMoveUp={store.toggleReadyToMoveUp}
              onRemove={store.removeExerciseFromWorkout} />
          ))}
          <button onClick={() => setShowSelector(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
            style={{ background: '#141414', color: '#00d4ff', border: '1px dashed #1e1e1e' }}>
            <Plus size={18} /> Add Exercise
          </button>
        </div>
      </div>

      {showSelector && <ExerciseSelector currentExercises={activeWorkout.exercises.map(e => e.name)} onSelect={store.addExerciseToWorkout} onClose={() => setShowSelector(false)} />}
      {showTimer    && <RestTimer onClose={() => setShowTimer(false)} />}

      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
            <h2 className="text-white font-bold text-lg">Finish workout?</h2>
            <p className="text-sm" style={{ color: '#888' }}>{activeWorkout.exercises.length} exercise{activeWorkout.exercises.length !== 1 ? 's' : ''} · {fmt(elapsed)}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishConfirm(false)} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#2a2a2a', color: '#888' }}>Cancel</button>
              <button onClick={() => { store.finishWorkout(); setShowFinishConfirm(false) }} className="flex-1 py-3 rounded-2xl font-semibold text-sm text-black" style={{ background: '#00d4ff' }}>Save Workout</button>
            </div>
            <button onClick={() => { store.discardWorkout(); setShowFinishConfirm(false) }} className="text-sm text-center py-1" style={{ color: '#ef4444' }}>Discard workout</button>
          </div>
        </div>
      )}
    </>
  )
}
