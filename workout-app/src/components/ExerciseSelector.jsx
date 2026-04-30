import { useState, useMemo } from 'react'
import { X, Search, ChevronRight, Plus } from 'lucide-react'
import { EXERCISES, SPLITS, SPLIT_LABELS } from '../data/exercises'

export default function ExerciseSelector({ onSelect, onClose, currentExercises = [] }) {
  const [search, setSearch] = useState('')
  const [activeSplit, setActiveSplit] = useState(SPLITS[0])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const pool = search ? EXERCISES : EXERCISES.filter(e => e.split === activeSplit)
    return pool.filter(e => !q || e.name.toLowerCase().includes(q))
  }, [search, activeSplit])

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

      {/* Split tabs (hidden during search) */}
      {!search && (
        <div className="flex px-4 gap-2 pb-3 overflow-x-auto">
          {SPLITS.map(s => (
            <button
              key={s}
              onClick={() => setActiveSplit(s)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: activeSplit === s ? '#00d4ff' : '#1e1e1e',
                color: activeSplit === s ? '#000' : '#888',
              }}
            >
              {SPLIT_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {Object.entries(grouped).map(([group, exercises]) => (
          <div key={group} className="mb-4">
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#00d4ff' }}>
              {group}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
              {exercises.map((ex, i) => {
                const added = isAdded(ex.name)
                return (
                  <button
                    key={ex.name}
                    onClick={() => { if (!added) { onSelect(ex.name); onClose() } }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:bg-white/5"
                    style={{
                      borderBottom: i < exercises.length - 1 ? '1px solid #1e1e1e' : 'none',
                      opacity: added ? 0.4 : 1,
                    }}
                  >
                    <div>
                      <div className="text-white text-sm font-medium">{ex.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#666' }}>
                        {ex.primaryMuscles.map(m => m.replace('_', ' ')).join(', ')}
                      </div>
                    </div>
                    {added ? (
                      <span className="text-xs" style={{ color: '#00d4ff' }}>Added</span>
                    ) : (
                      <Plus size={18} className="text-gray-600" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-600">
            <Search size={32} />
            <span className="text-sm">No exercises found</span>
          </div>
        )}
      </div>
    </div>
  )
}
