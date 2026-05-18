import { useState, useMemo } from 'react'
import { X, Search, Plus, Sparkles } from 'lucide-react'
import { EXERCISES, MUSCLE_LABELS } from '../data/exercises'
import { useWorkoutStore } from '../store/workoutStore'
import { useWgerGif } from '../utils/wgerGif'

// Simple fuzzy match score (lower = better)
function fuzzyScore(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase()
  if (a === b) return 0
  if (a.includes(b) || b.includes(a)) return 1
  // Word overlap
  const aWords = a.split(/\s+/)
  const bWords = b.split(/\s+/)
  const overlap = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)))
  if (overlap.length > 0) return 2 - overlap.length * 0.1
  // Char similarity
  let matches = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) matches++
  return 3 - matches / Math.max(a.length, b.length)
}

// Create New Exercise inline form
function CreateExerciseForm({ onAdd, onClose, initialName = '' }) {
  const [name, setName] = useState(initialName)
  const [primaryMuscle, setPrimaryMuscle] = useState('')
  const [equipment, setEquipment] = useState('')

  const MUSCLE_OPTIONS = Object.entries(MUSCLE_LABELS).slice(0, 16)
  const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other']

  const inferSplit = (muscle) => {
    if (['chest', 'biceps', 'forearms'].includes(muscle)) return 'ChestBi'
    if (['lats', 'mid_back', 'lower_back', 'triceps', 'traps'].includes(muscle)) return 'BackTri'
    if (['front_delt', 'side_delt', 'rear_delt'].includes(muscle)) return 'Shoulders'
    return 'LegsAbs'
  }

  const handleAdd = () => {
    if (!name.trim() || !primaryMuscle) return
    onAdd({
      name: name.trim(),
      split: inferSplit(primaryMuscle),
      muscleGroup: MUSCLE_LABELS[primaryMuscle] || primaryMuscle,
      primaryMuscles: [primaryMuscle],
      secondaryMuscles: [],
      equipment: equipment || 'Other',
      custom: true,
    })
    onClose()
  }

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#1a1a1a', border: '1px solid #22c55e33' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: '#22c55e' }}>Create New Exercise</span>
        <button onClick={onClose} style={{ color: '#555' }}><X size={16} /></button>
      </div>
      <input
        autoFocus
        type="text"
        placeholder="Exercise name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
        style={{ background: '#2a2a2a' }}
      />
      <div>
        <div className="text-xs font-semibold mb-1.5" style={{ color: '#555' }}>Primary Muscle</div>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_OPTIONS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPrimaryMuscle(id)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: primaryMuscle === id ? '#22c55e22' : '#2a2a2a',
                color: primaryMuscle === id ? '#22c55e' : '#555',
                border: primaryMuscle === id ? '1px solid #22c55e44' : '1px solid transparent',
              }}
            >{label}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold mb-1.5" style={{ color: '#555' }}>Equipment</div>
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_OPTIONS.map(eq => (
            <button
              key={eq}
              onClick={() => setEquipment(eq)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: equipment === eq ? '#22c55e22' : '#2a2a2a',
                color: equipment === eq ? '#22c55e' : '#555',
                border: equipment === eq ? '1px solid #22c55e44' : '1px solid transparent',
              }}
            >{eq}</button>
          ))}
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={!name.trim() || !primaryMuscle}
        className="w-full py-3 rounded-xl font-bold text-sm"
        style={{ background: name.trim() && primaryMuscle ? '#22c55e' : '#2a2a2a', color: name.trim() && primaryMuscle ? '#000' : '#555' }}
      >Add Exercise</button>
    </div>
  )
}

// Exercise row with optional GIF thumbnail
function ExerciseRow({ ex, isAdded, onSelect, showGif, borderBottom }) {
  const gif = useWgerGif(showGif ? ex.name : null)

  return (
    <button
      onClick={() => { if (!isAdded) onSelect(ex.name) }}
      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:bg-white/5"
      style={{ borderBottom: borderBottom ? '1px solid #1e1e1e' : 'none', opacity: isAdded ? 0.4 : 1 }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showGif && (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#2a2a2a' }}>
            {gif ? (
              <img src={gif} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-4 h-4 rounded-full" style={{ background: '#3a3a3a' }} />
            )}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">{ex.name}</div>
          <div className="text-xs mt-0.5" style={{ color: '#666' }}>
            {ex.primaryMuscles.map(m => m.replace('_', ' ')).join(', ')}
          </div>
        </div>
      </div>
      {isAdded ? (
        <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#22c55e' }}>Added</span>
      ) : (
        <Plus size={18} className="text-gray-600 flex-shrink-0" />
      )}
    </button>
  )
}

export default function ExerciseSelector({ onSelect, onClose, currentExercises = [] }) {
  const store = useWorkoutStore()
  const MUSCLE_GROUPS = ['Chest','Back','Shoulder','Bicep','Tricep','Quad','Hamstring','Glute','Abs','Calf','Forearm','Rear Delt','Trap']
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('Chest')
  const [showCreate, setShowCreate] = useState(false)

  const allExercises = useMemo(() => [...EXERCISES, ...(store.customExercises || [])], [store.customExercises])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const pool = search ? allExercises : allExercises.filter(e => e.muscleGroup === activeGroup)
    return pool.filter(e => !q || e.name.toLowerCase().includes(q))
  }, [search, activeGroup, allExercises])

  // Fuzzy suggestions when no results
  const fuzzySuggestions = useMemo(() => {
    if (!search || filtered.length > 0) return []
    const q = search.toLowerCase()
    return allExercises
      .map(e => ({ ex: e, score: fuzzyScore(e.name, q) }))
      .filter(x => x.score < 2.5)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(x => x.ex)
  }, [search, filtered, allExercises])

  // Group by muscleGroup
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(e => {
      if (!map[e.muscleGroup]) map[e.muscleGroup] = []
      map[e.muscleGroup].push(e)
    })
    return map
  }, [filtered])

  const isAdded = (name) => currentExercises.includes(name)
  const showGif = !!search && filtered.length > 0 && filtered.length <= 20

  const handleAddCustom = (exercise) => {
    store.addCustomExercise(exercise)
    onSelect(exercise.name)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={22} />
        </button>
        <span className="text-white font-semibold text-lg flex-1">Add Exercise</span>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: '#1e1e1e' }}>
          <Search size={16} className="text-gray-500 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-500">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Muscle group tabs (hidden during search) */}
      {!search && (
        <div className="flex px-4 gap-2 pb-3 overflow-x-auto">
          {MUSCLE_GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: activeGroup === g ? '#22c55e' : '#1e1e1e',
                color: activeGroup === g ? '#000' : '#888',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Create form */}
        {showCreate && (
          <div className="mb-4">
            <CreateExerciseForm
              onAdd={handleAddCustom}
              onClose={() => setShowCreate(false)}
              initialName={search}
            />
          </div>
        )}

        {/* Fuzzy suggestions when no results */}
        {search && filtered.length === 0 && fuzzySuggestions.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Did you mean…</div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
              {fuzzySuggestions.map((ex, i) => (
                <ExerciseRow
                  key={ex.name}
                  ex={ex}
                  isAdded={isAdded(ex.name)}
                  onSelect={name => { onSelect(name); onClose() }}
                  showGif={false}
                  borderBottom={i < fuzzySuggestions.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* No results — show create option */}
        {search && filtered.length === 0 && !showCreate && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Search size={32} className="text-gray-700" />
            <span className="text-sm" style={{ color: '#555' }}>No exercises found for "{search}"</span>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}
            >
              <Plus size={16} />
              Create "{search}"
            </button>
          </div>
        )}

        {/* Regular results */}
        {Object.entries(grouped).map(([group, exercises]) => (
          <div key={group} className="mb-4">
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>
              {group}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
              {exercises.map((ex, i) => (
                <ExerciseRow
                  key={ex.name}
                  ex={ex}
                  isAdded={isAdded(ex.name)}
                  onSelect={name => { onSelect(name); onClose() }}
                  showGif={showGif}
                  borderBottom={i < exercises.length - 1}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Add create button at bottom when search has results */}
        {search && filtered.length > 0 && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm mt-2"
            style={{ background: '#141414', color: '#22c55e', border: '1px dashed #22c55e44' }}
          >
            <Plus size={16} /> Create New Exercise
          </button>
        )}
      </div>
    </div>
  )
}
