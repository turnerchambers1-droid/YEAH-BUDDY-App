import { useState, useMemo } from 'react'
import { Search, X, ChevronRight, Sparkles, Plus } from 'lucide-react'
import { EXERCISES, MUSCLE_LABELS, SPLITS, SPLIT_LABELS } from '../data/exercises'
import { useWorkoutStore } from '../store/workoutStore'
import MuscleBodyMap from './MuscleBodyMap'
import { useWgerGif } from '../utils/wgerGif'

// Specific-muscle grouping order (spec item 6)
const MUSCLE_GROUP_ORDER = [
  'chest', 'lats', 'mid_back', 'lower_back', 'traps',
  'front_delt', 'side_delt', 'rear_delt',
  'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves',
  'abs', 'adductors', 'abductors',
]

function suggestMuscles(name) {
  const n = name.toLowerCase()
  const primary = []
  const secondary = []

  if (/bench|chest|fly|pec|press/.test(n) && !/shoulder|overhead|military/.test(n)) {
    primary.push('chest'); secondary.push('front_delt', 'triceps')
  }
  if (/curl|bicep|preacher|hammer curl/.test(n) && !/leg curl|tricep/.test(n)) {
    primary.push('biceps'); secondary.push('forearms')
  }
  if (/skull|pushdown|extension|dip|tricep|kickback|close grip/.test(n)) {
    primary.push('triceps'); if (/dip|close grip/.test(n)) secondary.push('chest', 'front_delt')
  }
  if (/pull up|chin up|pull-up|lat|pulldown|row/.test(n) && !/upright row/.test(n)) {
    primary.push('lats'); secondary.push('biceps', 'mid_back')
  }
  if (/row/.test(n) && !/upright row/.test(n)) {
    if (!primary.includes('mid_back')) { primary.push('mid_back'); secondary.push('lats', 'biceps') }
  }
  if (/shrug|trap/.test(n)) primary.push('traps')
  if (/shoulder press|overhead press|military|arnold|front raise|lateral raise|lat raise/.test(n)) {
    if (/front raise/.test(n)) primary.push('front_delt')
    else if (/lat raise|lateral/.test(n)) { primary.push('side_delt'); secondary.push('traps') }
    else { primary.push('side_delt'); secondary.push('front_delt', 'triceps') }
  }
  if (/rear delt|face pull|reverse fly/.test(n)) {
    primary.push('rear_delt'); secondary.push('mid_back', 'traps')
  }
  if (/squat|leg press|lunge|hack squat|belt squat/.test(n)) {
    primary.push('quads'); secondary.push('glutes', 'hamstrings')
  }
  if (/deadlift|rdl|stiff|leg curl|hamstring/.test(n)) {
    primary.push('hamstrings'); secondary.push('glutes', 'lower_back')
  }
  if (/glute|hip thrust|back extension/.test(n)) {
    primary.push('glutes'); secondary.push('hamstrings')
  }
  if (/calf|raise/.test(n) && !/shoulder raise|lat raise|front raise/.test(n)) primary.push('calves')
  if (/crunch|situp|sit-up|ab |abs|leg raise/.test(n)) primary.push('abs')
  if (/wrist|forearm/.test(n)) primary.push('forearms')

  const uniquePrimary = [...new Set(primary)]
  const uniqueSecondary = [...new Set(secondary)].filter(m => !uniquePrimary.includes(m))
  return { primary: uniquePrimary, secondary: uniqueSecondary }
}

function NewExerciseModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [split, setSplit] = useState('ChestBi')
  const [muscleGroup, setMuscleGroup] = useState('Chest')
  const [primary, setPrimary] = useState([])
  const [secondary, setSecondary] = useState([])
  const [suggested, setSuggested] = useState(false)

  const handleSuggest = () => {
    const result = suggestMuscles(name)
    setPrimary(result.primary); setSecondary(result.secondary); setSuggested(true)
  }

  const toggleMuscle = (id, type) => {
    if (type === 'primary') {
      setPrimary(p => p.includes(id) ? p.filter(m => m !== id) : [...p, id])
      setSecondary(s => s.filter(m => m !== id))
    } else {
      setSecondary(s => s.includes(id) ? s.filter(m => m !== id) : [...s, id])
      setPrimary(p => p.filter(m => m !== id))
    }
  }

  const muscles = Object.entries(MUSCLE_LABELS)

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
        <span className="text-white font-semibold text-lg flex-1">New Exercise</span>
        <button
          onClick={() => {
            if (!name.trim()) return
            onAdd({ name: name.trim(), split, muscleGroup, primaryMuscles: primary, secondaryMuscles: secondary })
            onClose()
          }}
          className="px-4 py-2 rounded-xl text-sm font-bold text-black"
          style={{ background: name.trim() ? '#22c55e' : '#1e1e1e', color: name.trim() ? '#000' : '#555' }}
        >Add</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#666' }}>Exercise Name</label>
          <input
            autoFocus type="text" placeholder="e.g. Cable Crossover"
            value={name}
            onChange={e => { setName(e.target.value); setSuggested(false) }}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: '#1e1e1e' }}
          />
        </div>

        {name.trim().length > 2 && !suggested && (
          <button
            onClick={handleSuggest}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}
          >
            <Sparkles size={16} />
            Suggest muscles for "{name}"
          </button>
        )}

        {(primary.length > 0 || secondary.length > 0) && (
          <div className="rounded-2xl p-4" style={{ background: '#141414' }}>
            <MuscleBodyMap primaryMuscles={primary} secondaryMuscles={secondary} compact />
            <div className="flex gap-4 justify-center mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                <span className="text-xs" style={{ color: '#888' }}>Primary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#99f6e4' }} />
                <span className="text-xs" style={{ color: '#888' }}>Secondary</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#666' }}>Muscle Activation</label>
          <div className="flex flex-col gap-1">
            {muscles.map(([id, label]) => {
              const isPrimary = primary.includes(id)
              const isSecondary = secondary.includes(id)
              return (
                <div key={id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#141414' }}>
                  <span className="text-sm text-white">{label}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleMuscle(id, 'primary')}
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: isPrimary ? '#22c55e22' : '#2a2a2a',
                        color: isPrimary ? '#22c55e' : '#555',
                        border: isPrimary ? '1px solid #22c55e44' : '1px solid transparent',
                      }}
                    >Primary</button>
                    <button
                      onClick={() => toggleMuscle(id, 'secondary')}
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: isSecondary ? '#99f6e422' : '#2a2a2a',
                        color: isSecondary ? '#99f6e4' : '#555',
                        border: isSecondary ? '1px solid #99f6e444' : '1px solid transparent',
                      }}
                    >Secondary</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExerciseDetail({ exercise, onClose, pr }) {
  const gif = useWgerGif(exercise.name)

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
        <span className="text-white font-semibold text-lg flex-1">{exercise.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* GIF */}
        {gif && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
            <img src={gif} alt={exercise.name} className="w-full object-contain max-h-48" loading="lazy" />
          </div>
        )}

        {/* Muscle map */}
        <div className="rounded-2xl p-4" style={{ background: '#141414' }}>
          <MuscleBodyMap primaryMuscles={exercise.primaryMuscles} secondaryMuscles={exercise.secondaryMuscles} />
          <div className="flex gap-4 justify-center mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
              <span className="text-xs" style={{ color: '#888' }}>
                {exercise.primaryMuscles.map(m => MUSCLE_LABELS[m] || m).join(', ')}
              </span>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#99f6e4' }} />
                <span className="text-xs" style={{ color: '#888' }}>
                  {exercise.secondaryMuscles.map(m => MUSCLE_LABELS[m] || m).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {pr > 0 && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: '#141414' }}>
            <span className="text-2xl">🏆</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#22c55e' }}>Personal Record</div>
              <div className="text-white font-bold text-xl">{pr} lbs</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LibraryView() {
  const store = useWorkoutStore()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState(null)

  const allExercises = useMemo(() => [
    ...EXERCISES,
    ...store.customExercises,
  ], [store.customExercises])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allExercises.filter(e => !q || e.name.toLowerCase().includes(q))
  }, [search, allExercises])

  // Group by primary muscle (spec item 6)
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(e => {
      const muscle = e.primaryMuscles?.[0] || 'abs'
      if (!map[muscle]) map[muscle] = []
      map[muscle].push(e)
    })
    // Sort groups by spec order
    const ordered = {}
    MUSCLE_GROUP_ORDER.forEach(m => { if (map[m]) ordered[m] = map[m] })
    Object.keys(map).forEach(m => { if (!ordered[m]) ordered[m] = map[m] })
    return ordered
  }, [filtered])

  return (
    <>
      <div className="flex flex-col min-h-screen pb-24 pt-14">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Exercises</h1>
          <button
            onClick={() => setShowNew(true)}
            className="p-2.5 rounded-xl"
            style={{ background: '#141414', color: '#22c55e' }}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: '#141414' }}>
            <Search size={16} className="text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or muscle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
            />
            {search && <button onClick={() => setSearch('')} style={{ color: '#555' }}><X size={14} /></button>}
          </div>
        </div>

        {/* List — grouped by specific muscle */}
        <div className="flex-1 px-4 pb-4">
          {Object.entries(grouped).map(([muscle, exercises]) => (
            <div key={muscle} className="mb-5">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>
                {MUSCLE_LABELS[muscle] || muscle}
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
                {exercises.map((ex, i) => {
                  const pr = store.getPersonalRecord(ex.name)
                  return (
                    <button
                      key={ex.name}
                      onClick={() => setSelected(ex)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-white/5"
                      style={{ borderBottom: i < exercises.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{ex.name}</div>
                        <div className="text-xs mt-0.5 flex flex-wrap gap-1">
                          {ex.primaryMuscles.map(m => (
                            <span key={m} className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: '#22c55e22', color: '#22c55e' }}>
                              {MUSCLE_LABELS[m] || m}
                            </span>
                          ))}
                          {ex.secondaryMuscles.slice(0, 2).map(m => (
                            <span key={m} className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: '#99f6e411', color: '#99f6e4' }}>
                              {MUSCLE_LABELS[m] || m}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {pr > 0 && <span className="text-xs font-bold" style={{ color: '#22c55e' }}>{pr}lbs</span>}
                        <ChevronRight size={16} className="text-gray-700" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <NewExerciseModal
          onClose={() => setShowNew(false)}
          onAdd={store.addCustomExercise}
        />
      )}

      {selected && (
        <ExerciseDetail
          exercise={selected}
          onClose={() => setSelected(null)}
          pr={store.getPersonalRecord(selected.name)}
        />
      )}
    </>
  )
}
