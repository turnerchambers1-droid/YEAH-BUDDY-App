import { useState } from 'react'
import { Plus, Play, Trash2, X, ChevronRight } from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { SPLIT_LABELS, SPLITS, EXERCISES } from '../data/exercises'
import ExerciseSelector from './ExerciseSelector'

function CreateTemplateModal({ onClose }) {
  const store = useWorkoutStore()
  const [name, setName] = useState('')
  const [split, setSplit] = useState('ChestBi')
  const [exercises, setExercises] = useState([])
  const [showSelector, setShowSelector] = useState(false)

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return
    store.saveTemplate(name.trim(), split, exercises)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
          <span className="text-white font-semibold text-lg flex-1">New Template</span>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{
              background: name.trim() && exercises.length > 0 ? '#00d4ff' : '#1e1e1e',
              color: name.trim() && exercises.length > 0 ? '#000' : '#555',
            }}
          >
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#666' }}>Template Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Push Day A"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: '#1e1e1e' }}
            />
          </div>

          {/* Split */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#666' }}>Split</label>
            <div className="flex gap-2 flex-wrap">
              {SPLITS.map(s => (
                <button
                  key={s}
                  onClick={() => setSplit(s)}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    background: split === s ? '#00d4ff' : '#1e1e1e',
                    color: split === s ? '#000' : '#888',
                  }}
                >
                  {SPLIT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#666' }}>
              Exercises ({exercises.length})
            </label>
            {exercises.length > 0 && (
              <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#141414' }}>
                {exercises.map((name, i) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: i < exercises.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                  >
                    <span className="text-white text-sm">{name}</span>
                    <button
                      onClick={() => setExercises(e => e.filter(x => x !== name))}
                      style={{ color: '#555' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowSelector(true)}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
              style={{ background: '#141414', color: '#00d4ff', border: '1px dashed #1e1e1e' }}
            >
              <Plus size={18} />
              Add Exercise
            </button>
          </div>
        </div>
      </div>

      {showSelector && (
        <ExerciseSelector
          currentExercises={exercises}
          onSelect={(name) => setExercises(e => [...e, name])}
          onClose={() => setShowSelector(false)}
        />
      )}
    </>
  )
}

export default function TemplatesView() {
  const store = useWorkoutStore()
  const [showCreate, setShowCreate] = useState(false)

  const handleStart = (template) => {
    store.startFromTemplate(template)
  }

  return (
    <>
      <div className="flex flex-col min-h-screen pb-24 pt-14">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="p-2.5 rounded-xl"
            style={{ background: '#141414', color: '#00d4ff' }}
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="px-4 flex flex-col gap-3">
          {store.templates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#141414' }}>
                <Plus size={28} strokeWidth={1.5} style={{ color: '#333' }} />
              </div>
              <div className="text-center">
                <div className="text-white text-base font-semibold mb-1">No templates yet</div>
                <div className="text-sm" style={{ color: '#555' }}>Save your favourite workouts for quick access</div>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 px-6 py-3 rounded-2xl text-black font-semibold text-sm"
                style={{ background: '#00d4ff' }}
              >
                Create Template
              </button>
            </div>
          ) : (
            store.templates.map(t => (
              <div
                key={t.id}
                className="rounded-2xl p-4"
                style={{ background: '#141414' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-bold text-base">{t.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#666' }}>
                      {SPLIT_LABELS[t.split]} · {t.exercises.length} exercises
                    </div>
                  </div>
                  <button
                    onClick={() => store.deleteTemplate(t.id)}
                    className="p-1.5"
                    style={{ color: '#444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {t.exercises.slice(0, 5).map(name => (
                    <span
                      key={name}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: '#1e1e1e', color: '#888' }}
                    >
                      {name}
                    </span>
                  ))}
                  {t.exercises.length > 5 && (
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#1e1e1e', color: '#555' }}>
                      +{t.exercises.length - 5} more
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleStart(t)}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-black"
                  style={{ background: '#00d4ff' }}
                >
                  <Play size={16} fill="black" />
                  Start Workout
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreate && <CreateTemplateModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
