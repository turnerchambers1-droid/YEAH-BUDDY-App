import { useState } from 'react'
import { useWorkoutStore, getStoredUsers } from '../store/workoutStore'
import { UserCircle, Plus, ChevronRight, Trash2 } from 'lucide-react'

export default function UserSetup({ onDone }) {
  const store = useWorkoutStore()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const users = store.users || []

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    store.createUser(trimmed)
    onDone()
  }

  const handleSelect = (username) => {
    store.switchUser(username)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ border: '2px solid #1e1e1e' }}>
            <img src="/ronnie.jpg" alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(2.5) contrast(1.1)' }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">YEAH BUDDY</h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>Lightweight baby!</p>
          </div>
        </div>

        {/* Existing users */}
        {users.length > 0 && !creating && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Select Profile</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
              {users.map((u, i) => (
                <div key={u} style={{ borderBottom: i < users.length - 1 ? '1px solid #1e1e1e' : 'none' }} className="flex items-center">
                  <button
                    onClick={() => handleSelect(u)}
                    className="flex-1 flex items-center gap-3 px-4 py-4 text-left active:bg-white/5"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#00d4ff22', color: '#00d4ff' }}>
                      {u[0].toUpperCase()}
                    </div>
                    <span className="text-white font-semibold">{u}</span>
                    <ChevronRight size={16} className="ml-auto text-gray-600" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(u)}
                    className="px-4 py-4"
                    style={{ color: '#444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New user form */}
        {creating ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>New Profile</p>
            <input
              autoFocus
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full px-4 py-4 rounded-2xl text-white text-base outline-none"
              style={{ background: '#141414' }}
            />
            <div className="flex gap-3">
              <button onClick={() => setCreating(false)} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#1e1e1e', color: '#888' }}>Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-3 rounded-2xl font-semibold text-sm text-black" style={{ background: name.trim() ? '#00d4ff' : '#1e1e1e', color: name.trim() ? '#000' : '#555' }}>Start</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
            style={{ background: '#00d4ff', color: '#000' }}
          >
            <Plus size={18} />
            {users.length === 0 ? 'Create Profile' : 'Add Profile'}
          </button>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center px-6 z-60">
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
            <h2 className="text-white font-bold text-lg">Delete "{deleteConfirm}"?</h2>
            <p className="text-sm" style={{ color: '#888' }}>All workouts and data for this profile will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#2a2a2a', color: '#888' }}>Cancel</button>
              <button onClick={() => { store.deleteUserAccount(deleteConfirm); setDeleteConfirm(null) }} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#ef4444', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
