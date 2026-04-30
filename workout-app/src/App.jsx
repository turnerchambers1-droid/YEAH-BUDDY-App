import { useState } from 'react'
import { Dumbbell, BookOpen, TrendingUp, LayoutTemplate, User } from 'lucide-react'
import WorkoutLogger  from './components/WorkoutLogger'
import LibraryView    from './components/LibraryView'
import ProgressView   from './components/ProgressView'
import TemplatesView  from './components/TemplatesView'
import UserSetup      from './components/UserSetup'
import { useWorkoutStore } from './store/workoutStore'

const TABS = [
  { id: 'workout',   label: 'Workout',   Icon: Dumbbell },
  { id: 'library',   label: 'Exercises', Icon: BookOpen },
  { id: 'progress',  label: 'Progress',  Icon: TrendingUp },
  { id: 'templates', label: 'Templates', Icon: LayoutTemplate },
  { id: 'profile',   label: 'Profile',   Icon: User },
]

export default function App() {
  const [tab, setTab] = useState('workout')
  const store = useWorkoutStore()

  // First launch — no user selected
  if (!store.currentUser) {
    return <UserSetup onDone={() => {}} />
  }

  // Profile tab — show user switcher inline
  if (tab === 'profile') {
    return (
      <div className="relative" style={{ minHeight: '100dvh', background: '#0a0a0a' }}>
        <div style={{ paddingBottom: 72 }}>
          <div className="flex flex-col min-h-screen pb-24 pt-14 px-4">
            <h1 className="text-2xl font-bold text-white pt-4 pb-6">Profile</h1>

            {/* Current user card */}
            <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={{ background: '#141414' }}>
              <div className="w-14 h-14 rounded-full overflow-hidden" style={{ border: '2px solid #00d4ff33' }}>
                <img src="/ronnie.jpg" alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(2.2)' }} />
              </div>
              <div>
                <div className="text-white font-bold text-lg">{store.currentUser}</div>
                <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                  {store.workouts.length} workout{store.workouts.length !== 1 ? 's' : ''} logged
                </div>
              </div>
            </div>

            {/* Switch / add profiles */}
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>All Profiles</div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#141414' }}>
              {(store.users || []).map((u, i, arr) => (
                <button
                  key={u}
                  onClick={() => { store.switchUser(u) }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-white/5"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: u === store.currentUser ? '#00d4ff22' : '#1e1e1e', color: u === store.currentUser ? '#00d4ff' : '#888' }}>
                    {u[0].toUpperCase()}
                  </div>
                  <span className="text-white font-medium flex-1">{u}</span>
                  {u === store.currentUser && <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#00d4ff22', color: '#00d4ff' }}>Active</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('gaintracker_current_user')
                window.location.reload()
              }}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
              style={{ background: '#141414', color: '#00d4ff', border: '1px dashed #1e1e1e' }}
            >
              + Add / Switch Profile
            </button>
          </div>
        </div>
        <BottomNav tab={tab} setTab={setTab} store={store} />
      </div>
    )
  }

  return (
    <div className="relative" style={{ minHeight: '100dvh', background: '#0a0a0a' }}>
      <div style={{ paddingBottom: 72 }}>
        {tab === 'workout'   && <WorkoutLogger />}
        {tab === 'library'   && <LibraryView />}
        {tab === 'progress'  && <ProgressView />}
        {tab === 'templates' && <TemplatesView />}
      </div>

      {store.activeWorkout && tab !== 'workout' && (
        <button onClick={() => setTab('workout')}
          className="fixed top-5 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-black shadow-lg"
          style={{ background: '#00d4ff' }}>
          <span className="w-2 h-2 rounded-full bg-black animate-pulse" />Live
        </button>
      )}

      <BottomNav tab={tab} setTab={setTab} store={store} />
    </div>
  )
}

function BottomNav({ tab, setTab, store }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex"
      style={{ background: '#0f0f0f', borderTop: '1px solid #1e1e1e', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 30 }}>
      {TABS.map(({ id, label, Icon }) => {
        const active  = tab === id
        const showDot = id === 'workout' && store.activeWorkout
        return (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-colors"
            style={{ color: active ? '#00d4ff' : '#444' }}>
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {showDot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: '#00d4ff' }} />}
            </div>
            <span className="text-xs font-semibold" style={{ fontSize: 10 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
