import { useState } from 'react'
import { Dumbbell, BookOpen, TrendingUp, User, Users, RotateCcw, X, Trash2, LogOut, Download, Upload } from 'lucide-react'
import WorkoutLogger  from './components/WorkoutLogger'
import LibraryView    from './components/LibraryView'
import ProgressView   from './components/ProgressView'
import SocialView     from './components/SocialView'
import UserSetup      from './components/UserSetup'
import { useWorkoutStore } from './store/workoutStore'
import { SPLIT_LABELS } from './data/exercises'

const TABS = [
  { id: 'workout',  label: 'Workout',   Icon: Dumbbell },
  { id: 'library',  label: 'Exercises', Icon: BookOpen },
  { id: 'progress', label: 'Progress',  Icon: TrendingUp },
  { id: 'social',   label: 'Community', Icon: Users },
  { id: 'profile',  label: 'Profile',   Icon: User },
]

// ── CSV import/export helpers ──────────────────────────────────────────────
function exportWorkoutsCSV(workouts) {
  const rows = [['date','workout_name','exercise_name','set_number','weight','reps']]
  workouts.forEach(w => {
    const wName = w.name || w.split || ''
    w.exercises.forEach(ex => {
      ex.sets.forEach((s, i) => {
        rows.push([w.date, wName, ex.name, i + 1, s.weight || '', s.reps || ''])
      })
    })
  })
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `yeah-buddy-workouts-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(a.href)
}

function parseWorkoutsCSV(text) {
  const lines = text.trim().split('\n').slice(1) // skip header
  const map = {}
  lines.forEach(line => {
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim())
    const [date, workout_name, exercise_name, set_number, weight, reps] = cols
    if (!date || !exercise_name) return
    const key = `${date}__${workout_name}`
    if (!map[key]) map[key] = { id: crypto.randomUUID(), date, name: workout_name || null, split: 'custom', startTime: new Date(date).getTime(), exercises: [] }
    let ex = map[key].exercises.find(e => e.name === exercise_name)
    if (!ex) { ex = { name: exercise_name, sets: [], notes: '' }; map[key].exercises.push(ex) }
    ex.sets.push({ id: crypto.randomUUID(), weight: weight || '', reps: reps || '' })
  })
  return Object.values(map)
}

// ── Recently Deleted modal (lives in Profile) ─────────────────────────────
function RecentlyDeletedModal({ store, onClose }) {
  const deleted = store.recentlyDeleted || []

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
        <span className="text-white font-semibold text-lg flex-1">Recently Deleted</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {deleted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16" style={{ color: '#555' }}>
            <Trash2 size={36} strokeWidth={1.5} />
            <span className="text-sm">No recently deleted workouts</span>
          </div>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: '#555' }}>Workouts are permanently removed after 3 days.</p>
            {deleted.map(w => {
              const daysLeft = Math.max(0, Math.ceil((w.deletedAt + 3 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)))
              return (
                <div key={w.id} className="rounded-2xl px-4 py-3 mb-2 flex items-center justify-between" style={{ background: '#141414' }}>
                  <div>
                    <div className="text-white text-sm font-semibold">{w.name || SPLIT_LABELS[w.split] || w.split}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#ef4444' }}>
                      {w.date} · purges in {daysLeft}d
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => store.restoreDeletedWorkout(w.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: '#22c55e22', color: '#22c55e' }}
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button
                      onClick={() => store.permanentDeleteWorkout(w.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: '#ef444422', color: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ── Profile tab ────────────────────────────────────────────────────────────
function ProfileTab({ store, tab, setTab }) {
  const [showDeleted, setShowDeleted] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [importError, setImportError] = useState('')
  const deletedCount  = (store.recentlyDeleted || []).length
  const archivedCount = (store.archivedWorkouts || []).length

  return (
    <div className="relative" style={{ minHeight: '100dvh', background: '#0a0a0a' }}>
      <div style={{ paddingBottom: 72 }}>
        <div className="flex flex-col min-h-screen pb-24 pt-14 px-4">
          <h1 className="text-2xl font-bold text-white pt-4 pb-6">Profile</h1>

          {/* Current user card */}
          <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={{ background: '#141414' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black"
              style={{ background: '#22c55e22', color: '#22c55e', border: '2px solid #22c55e44' }}>
              {store.currentUser?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold text-lg">{store.currentUser}</div>
              <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                {store.workouts.length} workout{store.workouts.length !== 1 ? 's' : ''} logged
              </div>
            </div>
          </div>

          {/* Data management */}
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Data</div>
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#141414' }}>
            <button
              onClick={() => setShowDeleted(true)}
              className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-white/5"
              style={{ borderBottom: '1px solid #1e1e1e' }}
            >
              <div className="flex items-center gap-3">
                <Trash2 size={17} color="#888" />
                <span className="text-white text-sm font-medium">Recently Deleted</span>
              </div>
              {deletedCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#ef444422', color: '#ef4444' }}>
                  {deletedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📦</span>
                <span className="text-white text-sm font-medium">Archived Workouts</span>
              </div>
              {archivedCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#88888822', color: '#888' }}>
                  {archivedCount}
                </span>
              )}
            </button>
          </div>

          {/* Voice */}
          <div className="text-xs font-bold uppercase tracking-widest mb-3 mt-1" style={{ color: '#555' }}>Voice Prompts</div>
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#141414' }}>
            {[
              { id: 'positive', label: 'Positive', sub: 'Ronnie hypes you up', icon: '💪' },
              { id: 'negative', label: 'Savage Mode', sub: 'Ronnie shames you into lifting', icon: '💀' },
              { id: 'off',      label: 'Off',        sub: 'No voice prompts',               icon: '🔇' },
            ].map((opt, i, arr) => (
              <button
                key={opt.id}
                onClick={() => store.setVoiceMode(opt.id)}
                className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-white/5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #1e1e1e' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6">{opt.icon}</span>
                  <div>
                    <div className="text-white text-sm font-medium">{opt.label}</div>
                    <div className="text-xs" style={{ color: '#555' }}>{opt.sub}</div>
                  </div>
                </div>
                {store.voiceMode === opt.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Import / Export */}
          <div className="text-xs font-bold uppercase tracking-widest mb-3 mt-1" style={{ color: '#555' }}>Data Transfer</div>
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#141414' }}>
            <button
              onClick={() => exportWorkoutsCSV(store.workouts)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-white/5"
              style={{ borderBottom: '1px solid #1e1e1e' }}
            >
              <Download size={17} color="#22c55e" />
              <div>
                <div className="text-white text-sm font-medium">Export Workouts</div>
                <div className="text-xs" style={{ color: '#555' }}>Download all workouts as CSV</div>
              </div>
            </button>
            <label className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-white/5 cursor-pointer">
              <Upload size={17} color="#888" />
              <div className="flex-1">
                <div className="text-white text-sm font-medium">Import Workouts</div>
                <div className="text-xs" style={{ color: '#555' }}>CSV: date, workout_name, exercise_name, set_number, weight, reps</div>
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={e => {
                const file = e.target.files[0]; if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  try {
                    const workouts = parseWorkoutsCSV(ev.target.result)
                    workouts.forEach(w => store.importWorkout(w))
                    setImportError(`Imported ${workouts.length} workout${workouts.length !== 1 ? 's' : ''}`)
                  } catch { setImportError('Import failed — check CSV format') }
                }
                reader.readAsText(file)
                e.target.value = ''
              }} />
            </label>
          </div>
          {importError && (
            <p className="text-xs text-center mb-4" style={{ color: importError.startsWith('Imported') ? '#22c55e' : '#ef4444' }}>{importError}</p>
          )}

          {/* Sign out */}
          <button
            onClick={store.signOut}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
            style={{ background: '#141414', color: '#ef4444', border: '1px solid #1e1e1e' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <BottomNav tab={tab} setTab={setTab} store={store} />

      {showDeleted && <RecentlyDeletedModal store={store} onClose={() => setShowDeleted(false)} />}

      {showArchived && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
          <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
            <button onClick={() => setShowArchived(false)} className="text-gray-400 hover:text-white"><X size={22} /></button>
            <span className="text-white font-semibold text-lg flex-1">Archived Workouts</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {(store.archivedWorkouts || []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16" style={{ color: '#555' }}>
                <span className="text-3xl">📦</span>
                <span className="text-sm">No archived workouts</span>
              </div>
            ) : (
              (store.archivedWorkouts || []).map(w => (
                <div key={w.id} className="rounded-2xl px-4 py-3 mb-2 flex items-center justify-between" style={{ background: '#141414' }}>
                  <div>
                    <div className="text-white text-sm font-semibold">{w.name || SPLIT_LABELS[w.split] || w.split}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#555' }}>{w.date} · {w.exercises.length} exercises</div>
                  </div>
                  <button
                    onClick={() => store.unarchiveWorkout(w.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: '#22c55e22', color: '#22c55e' }}
                  >
                    <RotateCcw size={12} /> Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('workout')
  const store = useWorkoutStore()

  if (store.loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#22c55e', borderTopColor: 'transparent' }} />
        <span className="text-sm font-semibold" style={{ color: '#555' }}>Loading…</span>
      </div>
    </div>
  )

  if (!store.currentUser) return <UserSetup />

  if (tab === 'profile') return <ProfileTab store={store} tab={tab} setTab={setTab} />

  return (
    <div className="relative" style={{ minHeight: '100dvh', background: '#0a0a0a' }}>
      <div style={{ paddingBottom: 72 }}>
        <div style={{ display: tab === 'workout' ? 'block' : 'none' }}>
          <WorkoutLogger />
        </div>
        {tab === 'library'  && <LibraryView />}
        {tab === 'progress' && <ProgressView />}
        {tab === 'social'   && <SocialView />}
      </div>

      {store.activeWorkout && tab !== 'workout' && (
        <button onClick={() => setTab('workout')}
          className="fixed top-5 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-black shadow-lg"
          style={{ background: '#22c55e' }}>
          <span className="w-2 h-2 rounded-full bg-black animate-pulse" />Live
        </button>
      )}

      <BottomNav tab={tab} setTab={setTab} store={store} />
    </div>
  )
}

function BottomNav({ tab, setTab, store }) {
  const pendingSocial = (store.friendRequests?.received || []).length
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex"
      style={{ background: '#0f0f0f', borderTop: '1px solid #1e1e1e', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 30 }}>
      {TABS.map(({ id, label, Icon }) => {
        const active  = tab === id
        const showDot = id === 'workout' && store.activeWorkout
        const badge   = id === 'social' && pendingSocial > 0
        return (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-colors"
            style={{ color: active ? '#22c55e' : '#444' }}>
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {showDot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />}
              {badge && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: '#ef4444', color: '#fff', fontSize: 8 }}>{pendingSocial}</span>}
            </div>
            <span className="text-xs font-semibold" style={{ fontSize: 10 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
