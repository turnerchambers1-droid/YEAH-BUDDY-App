import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default function UserSetup() {
  const [mode, setMode]       = useState('login') // 'login' | 'signup'
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (mode === 'signup' && !name.trim()) { setError('Enter your name'); return }
    if (!email.trim()) { setError('Enter your email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const displayName = name.trim()
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        // Write Firestore docs before onAuthStateChanged handler runs so it
        // finds the correct display name rather than the email prefix fallback
        await Promise.all([
          updateProfile(cred.user, { displayName }),
          setDoc(doc(db, 'users', cred.user.uid), {
            displayName, email: email.trim(), createdAt: serverTimestamp(),
            activeWorkout: null, customExercises: [], savedHomeTiles: [], friends: [],
          }),
          setDoc(doc(db, 'userProfiles', cred.user.uid), { uid: cred.user.uid, displayName }),
        ])
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Incorrect email or password',
        'auth/user-not-found': 'No account found with this email',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/too-many-requests': 'Too many attempts — try again later',
      }
      setError(msgs[e.code] || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ border: '2px solid #1e1e1e' }}>
            <img src="/ronnie.jpg" alt="" className="w-full h-full object-cover" style={{ filter: 'saturate(2.5) contrast(1.1)' }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">YEAH BUDDY</h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>Lightweight baby!</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: '#141414' }}>
          <button
            onClick={() => { setMode('login'); setError('') }}
            className="flex-1 py-2.5 text-sm font-bold transition-colors"
            style={{ background: mode === 'login' ? '#22c55e' : 'transparent', color: mode === 'login' ? '#000' : '#555' }}
          >Sign In</button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className="flex-1 py-2.5 text-sm font-bold transition-colors"
            style={{ background: mode === 'signup' ? '#22c55e' : 'transparent', color: mode === 'signup' ? '#000' : '#555' }}
          >Create Account</button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              autoFocus
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl text-white text-base outline-none"
              style={{ background: '#141414' }}
            />
          )}
          <input
            autoFocus={mode === 'login'}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-4 rounded-2xl text-white text-base outline-none"
            style={{ background: '#141414' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-4 rounded-2xl text-white text-base outline-none"
            style={{ background: '#141414' }}
          />
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base"
          style={{ background: loading ? '#1e1e1e' : '#22c55e', color: loading ? '#555' : '#000' }}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}
