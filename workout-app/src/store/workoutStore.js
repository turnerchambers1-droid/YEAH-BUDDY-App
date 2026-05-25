import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, orderBy, onSnapshot, where,
  arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore'
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth'
import { auth, db } from '../firebase'

// ── Default shape ──────────────────────────────────────────────────────────
function defaultData() {
  return {
    workouts: [],
    activeWorkout: null,
    templates: [],
    customExercises: [],
    archivedWorkouts: [],
    recentlyDeleted: [],
    savedHomeTiles: [],
    friends: [],
    friendRequests: { sent: [], received: [] },
    voiceMode: 'positive',
  }
}

// ── Global reactive store ──────────────────────────────────────────────────
let globalState = { uid: null, currentUser: null, loading: true, users: [], ...defaultData() }
const listeners = new Set()
let activeListeners = []

function setState(updater) {
  globalState = typeof updater === 'function' ? updater(globalState) : { ...globalState, ...updater }
  listeners.forEach(fn => fn(globalState))
}

function unsubscribeAll() {
  activeListeners.forEach(fn => fn())
  activeListeners = []
}

// Debounced Firestore write for rapidly-changing active workout
let userDocTimer = null
function updateUserDoc(uid, fields) {
  if (!uid) return
  clearTimeout(userDocTimer)
  userDocTimer = setTimeout(() => {
    updateDoc(doc(db, 'users', uid), fields).catch(() => {})
  }, 600)
}

// ── Load data and establish real-time listeners ────────────────────────────
async function initUserData(uid) {
  unsubscribeAll()

  const [templatesSnap, archivedSnap, deletedSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'templates')),
    getDocs(collection(db, 'users', uid, 'archivedWorkouts')),
    getDocs(collection(db, 'users', uid, 'recentlyDeleted')),
  ])

  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const validDeleted = deletedSnap.docs.map(d => d.data()).filter(w => now - w.deletedAt < THREE_DAYS)
  deletedSnap.docs
    .filter(d => now - d.data().deletedAt >= THREE_DAYS)
    .forEach(d => deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', d.id)).catch(() => {}))

  setState(s => ({
    ...s,
    templates: templatesSnap.docs.map(d => d.data()),
    archivedWorkouts: archivedSnap.docs.map(d => d.data()),
    recentlyDeleted: validDeleted,
  }))

  // Real-time: user document (settings, activeWorkout, friends)
  const unsubUser = onSnapshot(doc(db, 'users', uid), snap => {
    if (!snap.exists()) return
    const data = snap.data()
    setState(s => ({
      ...s,
      uid,
      currentUser: data.displayName || 'User',
      users: [data.displayName || 'User'],
      activeWorkout: data.activeWorkout || null,
      customExercises: data.customExercises || [],
      savedHomeTiles: data.savedHomeTiles || [],
      friends: data.friends || [],
      voiceMode: data.voiceMode || 'positive',
      loading: false,
    }))
  })

  // Real-time: workouts subcollection
  const unsubWorkouts = onSnapshot(
    query(collection(db, 'users', uid, 'workouts'), orderBy('startTime', 'desc')),
    snap => setState(s => ({ ...s, workouts: snap.docs.map(d => d.data()) }))
  )

  // Real-time: friend requests (incoming and outgoing)
  const unsubReceived = onSnapshot(
    query(collection(db, 'friendRequests'), where('to', '==', uid)),
    snap => setState(s => ({ ...s, friendRequests: { ...s.friendRequests, received: snap.docs.map(d => d.data().from) } }))
  )
  const unsubSent = onSnapshot(
    query(collection(db, 'friendRequests'), where('from', '==', uid)),
    snap => setState(s => ({ ...s, friendRequests: { ...s.friendRequests, sent: snap.docs.map(d => d.data().to) } }))
  )

  activeListeners = [unsubUser, unsubWorkouts, unsubReceived, unsubSent]
}

// ── Auth state listener ────────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (user) {
    setState(s => ({ ...s, uid: user.uid, loading: true }))
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      const displayName = user.displayName || user.email.split('@')[0]
      await setDoc(userRef, {
        displayName, email: user.email, createdAt: serverTimestamp(),
        activeWorkout: null, customExercises: [], savedHomeTiles: [], friends: [],
      })
      await setDoc(doc(db, 'userProfiles', user.uid), { uid: user.uid, displayName })
    }
    await initUserData(user.uid)
  } else {
    unsubscribeAll()
    setState({ uid: null, currentUser: null, loading: false, users: [], ...defaultData() })
  }
})

// ── Hook ───────────────────────────────────────────────────────────────────
export function useWorkoutStore() {
  const [state, setLocal] = useState(globalState)
  useEffect(() => { listeners.add(setLocal); return () => listeners.delete(setLocal) }, [])

  const uid = state.uid

  // ── Auth ──────────────────────────────────────────────────────────────────
  const signOut = useCallback(() => fbSignOut(auth), [])

  // ── Active Workout ────────────────────────────────────────────────────────
  const startWorkout = useCallback((split, customName) => {
    const workout = { id: crypto.randomUUID(), split, name: customName || null, startTime: Date.now(), exercises: [] }
    setState(s => ({ ...s, activeWorkout: workout }))
    if (uid) updateUserDoc(uid, { activeWorkout: workout })
  }, [uid])

  const addExerciseToWorkout = useCallback((exerciseName) => {
    setState(s => {
      if (!s.activeWorkout) return s
      if (s.activeWorkout.exercises.find(e => e.name === exerciseName)) return s
      const updated = { ...s.activeWorkout, exercises: [...s.activeWorkout.exercises, { name: exerciseName, sets: [], readyToMoveUp: false, notes: '' }] }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const removeExerciseFromWorkout = useCallback((exerciseName) => {
    setState(s => {
      if (!s.activeWorkout) return s
      const updated = { ...s.activeWorkout, exercises: s.activeWorkout.exercises.filter(e => e.name !== exerciseName) }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const addSet = useCallback((exerciseName, set) => {
    setState(s => {
      if (!s.activeWorkout) return s
      const updated = { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, sets: [...e.sets, { id: crypto.randomUUID(), ...set }] } : e) }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const updateSet = useCallback((exerciseName, setId, field, value) => {
    setState(s => {
      if (!s.activeWorkout) return s
      const updated = { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, sets: e.sets.map(st => st.id === setId ? { ...st, [field]: value } : st) } : e) }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const removeSet = useCallback((exerciseName, setId) => {
    setState(s => {
      if (!s.activeWorkout) return s
      const updated = { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, sets: e.sets.filter(st => st.id !== setId) } : e) }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const updateExerciseNotes = useCallback((exerciseName, notes) => {
    setState(s => {
      if (!s.activeWorkout) return s
      const updated = { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, notes } : e) }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const updateWorkoutNotes = useCallback((notes) => {
    setState(s => {
      if (!s.activeWorkout) return s
      const updated = { ...s.activeWorkout, notes }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const toggleReadyToMoveUp = useCallback((exerciseName) => {
    setState(s => {
      if (!s.activeWorkout) return s
      const updated = { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, readyToMoveUp: !e.readyToMoveUp } : e) }
      if (uid) updateUserDoc(uid, { activeWorkout: updated })
      return { ...s, activeWorkout: updated }
    })
  }, [uid])

  const finishWorkout = useCallback(() => {
    setState(s => {
      if (!s.activeWorkout) return s
      const completed = { ...s.activeWorkout, endTime: Date.now(), date: new Date().toISOString().slice(0, 10) }
      if (uid) {
        setDoc(doc(db, 'users', uid, 'workouts', completed.id), completed).catch(() => {})
        updateUserDoc(uid, { activeWorkout: null })
      }
      return { ...s, workouts: [completed, ...s.workouts], activeWorkout: null }
    })
  }, [uid])

  const discardWorkout = useCallback(() => {
    setState(s => ({ ...s, activeWorkout: null }))
    if (uid) updateUserDoc(uid, { activeWorkout: null })
  }, [uid])

  const softDeleteWorkout = useCallback((id) => {
    setState(s => {
      const workout = s.workouts.find(w => w.id === id)
      if (!workout) return s
      const deleted = { ...workout, deletedAt: Date.now() }
      if (uid) {
        deleteDoc(doc(db, 'users', uid, 'workouts', id)).catch(() => {})
        setDoc(doc(db, 'users', uid, 'recentlyDeleted', id), deleted).catch(() => {})
      }
      return { ...s, workouts: s.workouts.filter(w => w.id !== id), recentlyDeleted: [deleted, ...(s.recentlyDeleted || [])] }
    })
  }, [uid])

  const restoreDeletedWorkout = useCallback((id) => {
    setState(s => {
      const workout = (s.recentlyDeleted || []).find(w => w.id === id)
      if (!workout) return s
      const { deletedAt, ...clean } = workout
      if (uid) {
        deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', id)).catch(() => {})
        setDoc(doc(db, 'users', uid, 'workouts', id), clean).catch(() => {})
      }
      return { ...s, recentlyDeleted: s.recentlyDeleted.filter(w => w.id !== id), workouts: [clean, ...s.workouts] }
    })
  }, [uid])

  const permanentDeleteWorkout = useCallback((id) => {
    setState(s => ({ ...s, recentlyDeleted: (s.recentlyDeleted || []).filter(w => w.id !== id) }))
    if (uid) deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', id)).catch(() => {})
  }, [uid])

  const archiveWorkout = useCallback((id) => {
    setState(s => {
      const workout = s.workouts.find(w => w.id === id)
      if (!workout) return s
      const archived = { ...workout, archivedAt: Date.now() }
      if (uid) {
        deleteDoc(doc(db, 'users', uid, 'workouts', id)).catch(() => {})
        setDoc(doc(db, 'users', uid, 'archivedWorkouts', id), archived).catch(() => {})
      }
      return { ...s, workouts: s.workouts.filter(w => w.id !== id), archivedWorkouts: [archived, ...(s.archivedWorkouts || [])] }
    })
  }, [uid])

  const unarchiveWorkout = useCallback((id) => {
    setState(s => {
      const workout = (s.archivedWorkouts || []).find(w => w.id === id)
      if (!workout) return s
      const { archivedAt, ...clean } = workout
      if (uid) {
        deleteDoc(doc(db, 'users', uid, 'archivedWorkouts', id)).catch(() => {})
        setDoc(doc(db, 'users', uid, 'workouts', id), clean).catch(() => {})
      }
      return { ...s, archivedWorkouts: s.archivedWorkouts.filter(w => w.id !== id), workouts: [clean, ...s.workouts] }
    })
  }, [uid])

  // ── Home Tiles ─────────────────────────────────────────────────────────────
  const saveHomeTile = useCallback((name, exerciseNames) => {
    setState(s => {
      const tiles = [...(s.savedHomeTiles || []).filter(t => t.name !== name), { id: crypto.randomUUID(), name, exercises: exerciseNames }]
      if (uid) updateUserDoc(uid, { savedHomeTiles: tiles })
      return { ...s, savedHomeTiles: tiles }
    })
  }, [uid])

  const deleteHomeTile = useCallback((id) => {
    setState(s => {
      const tiles = (s.savedHomeTiles || []).filter(t => t.id !== id)
      if (uid) updateUserDoc(uid, { savedHomeTiles: tiles })
      return { ...s, savedHomeTiles: tiles }
    })
  }, [uid])

  const setVoiceMode = useCallback((mode) => {
    setState(s => ({ ...s, voiceMode: mode }))
    if (uid) updateDoc(doc(db, 'users', uid), { voiceMode: mode }).catch(() => {})
  }, [uid])

  const updateWorkout = useCallback((id, updates) => {
    setState(s => ({ ...s, workouts: s.workouts.map(w => w.id === id ? { ...w, ...updates } : w) }))
    if (uid) updateDoc(doc(db, 'users', uid, 'workouts', id), updates).catch(() => {})
  }, [uid])

  const importWorkout = useCallback((workout) => {
    setState(s => {
      if (s.workouts.find(w => w.id === workout.id)) return s
      if (uid) setDoc(doc(db, 'users', uid, 'workouts', workout.id), workout).catch(() => {})
      return { ...s, workouts: [workout, ...s.workouts].sort((a,b) => (b.startTime||0)-(a.startTime||0)) }
    })
  }, [uid])

  // ── Templates ──────────────────────────────────────────────────────────────
  const saveTemplate = useCallback((name, split, exerciseNames) => {
    const template = { id: crypto.randomUUID(), name, split, exercises: exerciseNames }
    setState(s => ({ ...s, templates: [...s.templates.filter(t => t.name !== name), template] }))
    if (uid) setDoc(doc(db, 'users', uid, 'templates', template.id), template).catch(() => {})
  }, [uid])

  const deleteTemplate = useCallback((id) => {
    setState(s => ({ ...s, templates: s.templates.filter(t => t.id !== id) }))
    if (uid) deleteDoc(doc(db, 'users', uid, 'templates', id)).catch(() => {})
  }, [uid])

  const startFromTemplate = useCallback((template) => {
    const workout = { id: crypto.randomUUID(), split: template.split, name: template.name, startTime: Date.now(), exercises: template.exercises.map(name => ({ name, sets: [], readyToMoveUp: false, notes: '' })) }
    setState(s => ({ ...s, activeWorkout: workout }))
    if (uid) updateUserDoc(uid, { activeWorkout: workout })
  }, [uid])

  // ── Custom Exercises ───────────────────────────────────────────────────────
  const addCustomExercise = useCallback((exercise) => {
    setState(s => {
      const exercises = [...s.customExercises, { ...exercise, custom: true }]
      if (uid) updateUserDoc(uid, { customExercises: exercises })
      return { ...s, customExercises: exercises }
    })
  }, [uid])

  // ── Social ─────────────────────────────────────────────────────────────────
  const sendFriendRequest = useCallback((targetUid) => {
    if (!uid || !targetUid || targetUid === uid) return
    const reqId = `${uid}_${targetUid}`
    setDoc(doc(db, 'friendRequests', reqId), {
      id: reqId, from: uid, fromName: globalState.currentUser, to: targetUid, createdAt: Date.now(),
    }).catch(() => {})
    setState(s => ({ ...s, friendRequests: { ...s.friendRequests, sent: [...new Set([...(s.friendRequests?.sent || []), targetUid])] } }))
  }, [uid])

  const cancelFriendRequest = useCallback((targetUid) => {
    if (!uid) return
    deleteDoc(doc(db, 'friendRequests', `${uid}_${targetUid}`)).catch(() => {})
    setState(s => ({ ...s, friendRequests: { ...s.friendRequests, sent: (s.friendRequests?.sent || []).filter(u => u !== targetUid) } }))
  }, [uid])

  const acceptFriendRequest = useCallback((fromUid) => {
    if (!uid) return
    Promise.all([
      updateDoc(doc(db, 'users', uid), { friends: arrayUnion(fromUid) }),
      updateDoc(doc(db, 'users', fromUid), { friends: arrayUnion(uid) }),
      deleteDoc(doc(db, 'friendRequests', `${fromUid}_${uid}`)),
    ]).catch(() => {})
    setState(s => ({
      ...s,
      friends: [...new Set([...(s.friends || []), fromUid])],
      friendRequests: { ...s.friendRequests, received: (s.friendRequests?.received || []).filter(u => u !== fromUid) },
    }))
  }, [uid])

  const rejectFriendRequest = useCallback((fromUid) => {
    if (!uid) return
    deleteDoc(doc(db, 'friendRequests', `${fromUid}_${uid}`)).catch(() => {})
    setState(s => ({ ...s, friendRequests: { ...s.friendRequests, received: (s.friendRequests?.received || []).filter(u => u !== fromUid) } }))
  }, [uid])

  const unfriend = useCallback((targetUid) => {
    if (!uid) return
    Promise.all([
      updateDoc(doc(db, 'users', uid), { friends: arrayRemove(targetUid) }),
      updateDoc(doc(db, 'users', targetUid), { friends: arrayRemove(uid) }),
    ]).catch(() => {})
    setState(s => ({ ...s, friends: (s.friends || []).filter(u => u !== targetUid) }))
  }, [uid])

  // ── History ────────────────────────────────────────────────────────────────
  const getExerciseHistory = useCallback((exerciseName) => {
    return state.workouts
      .filter(w => w.exercises.some(e => e.name === exerciseName))
      .map(w => {
        const ex = w.exercises.find(e => e.name === exerciseName)
        const maxWeight = Math.max(0, ...ex.sets.map(s => Number(s.weight) || 0))
        const totalVolume = ex.sets.reduce((acc, s) => acc + (Number(s.reps) || 0) * (Number(s.weight) || 0), 0)
        return { date: w.date, maxWeight, totalVolume, sets: ex.sets }
      })
      .reverse()
  }, [state.workouts])

  const getPersonalRecord = useCallback((exerciseName) => {
    return Math.max(0, ...getExerciseHistory(exerciseName).map(h => h.maxWeight))
  }, [getExerciseHistory])

  const getWorkoutDates = useCallback(() => state.workouts.map(w => w.date), [state.workouts])

  return {
    ...state,
    signOut,
    startWorkout, addExerciseToWorkout, removeExerciseFromWorkout,
    addSet, updateSet, removeSet, toggleReadyToMoveUp, updateExerciseNotes, updateWorkoutNotes,
    finishWorkout, discardWorkout,
    softDeleteWorkout, restoreDeletedWorkout, permanentDeleteWorkout,
    archiveWorkout, unarchiveWorkout,
    saveHomeTile, deleteHomeTile,
    setVoiceMode, updateWorkout, importWorkout,
    saveTemplate, deleteTemplate, startFromTemplate,
    addCustomExercise,
    sendFriendRequest, cancelFriendRequest, acceptFriendRequest, rejectFriendRequest, unfriend,
    getExerciseHistory, getPersonalRecord, getWorkoutDates,
  }
}
