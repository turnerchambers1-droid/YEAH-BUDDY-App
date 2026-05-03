import { useState, useEffect, useCallback } from 'react'

// ── User management ────────────────────────────────────────────────────────
const USERS_META_KEY   = 'gaintracker_users'
const CURRENT_USER_KEY = 'gaintracker_current_user'

export function getStoredUsers()   { try { return JSON.parse(localStorage.getItem(USERS_META_KEY) || '[]') } catch { return [] } }
export function getCurrentUser()   { return localStorage.getItem(CURRENT_USER_KEY) || null }
export function setCurrentUserKey(username) { localStorage.setItem(CURRENT_USER_KEY, username) }
export function addUser(username) {
  const users = getStoredUsers()
  if (!users.includes(username)) localStorage.setItem(USERS_META_KEY, JSON.stringify([...users, username]))
}
export function removeUser(username) {
  const users = getStoredUsers().filter(u => u !== username)
  localStorage.setItem(USERS_META_KEY, JSON.stringify(users))
  localStorage.removeItem(dataKey(username))
}

function dataKey(username) { return `gaintracker_${username}_v1` }

function purgeRecentlyDeleted(data) {
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000
  const now = Date.now()
  return {
    ...data,
    recentlyDeleted: (data.recentlyDeleted || []).filter(w => now - w.deletedAt < THREE_DAYS),
  }
}

export function loadData(username) {
  if (!username) return defaultState()
  try {
    const r = localStorage.getItem(dataKey(username))
    const parsed = r ? JSON.parse(r) : defaultState()
    return purgeRecentlyDeleted({ ...defaultState(), ...parsed })
  } catch { return defaultState() }
}

function saveData(username, data) {
  if (!username) return
  localStorage.setItem(dataKey(username), JSON.stringify(data))
}

function defaultState() {
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
  }
}

// ── Global reactive store ─────────────────────────────────────────────────
let currentUser = getCurrentUser()
let globalState = { currentUser, users: getStoredUsers(), ...loadData(currentUser) }
const listeners = new Set()

function setState(updater) {
  globalState = typeof updater === 'function' ? updater(globalState) : updater
  saveData(globalState.currentUser, {
    workouts: globalState.workouts,
    activeWorkout: globalState.activeWorkout,
    templates: globalState.templates,
    customExercises: globalState.customExercises,
    archivedWorkouts: globalState.archivedWorkouts,
    recentlyDeleted: globalState.recentlyDeleted,
    savedHomeTiles: globalState.savedHomeTiles,
    friends: globalState.friends,
    friendRequests: globalState.friendRequests,
  })
  listeners.forEach(fn => fn(globalState))
}

export function useWorkoutStore() {
  const [state, setLocal] = useState(globalState)
  useEffect(() => { listeners.add(setLocal); return () => listeners.delete(setLocal) }, [])

  // ── User actions ─────────────────────────────────────────────────────────
  const switchUser = useCallback((username) => {
    setCurrentUserKey(username)
    const userData = loadData(username)
    setState({ currentUser: username, users: getStoredUsers(), ...userData })
  }, [])

  const createUser = useCallback((username) => {
    addUser(username)
    setCurrentUserKey(username)
    setState({ currentUser: username, users: getStoredUsers(), ...defaultState() })
  }, [])

  const deleteUserAccount = useCallback((username) => {
    removeUser(username)
    const remaining = getStoredUsers()
    const nextUser = remaining.length > 0 ? remaining[0] : null
    if (nextUser) { setCurrentUserKey(nextUser); setState({ currentUser: nextUser, users: remaining, ...loadData(nextUser) }) }
    else { localStorage.removeItem(CURRENT_USER_KEY); setState({ currentUser: null, users: [], ...defaultState() }) }
  }, [])

  // ── Active Workout ────────────────────────────────────────────────────────
  const startWorkout = useCallback((split, customName) => {
    setState(s => ({ ...s, activeWorkout: { id: crypto.randomUUID(), split, name: customName || null, startTime: Date.now(), exercises: [] } }))
  }, [])

  const addExerciseToWorkout = useCallback((exerciseName) => {
    setState(s => {
      if (!s.activeWorkout) return s
      if (s.activeWorkout.exercises.find(e => e.name === exerciseName)) return s
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises: [...s.activeWorkout.exercises, { name: exerciseName, sets: [], readyToMoveUp: false, notes: '' }] } }
    })
  }, [])

  const removeExerciseFromWorkout = useCallback((exerciseName) => {
    setState(s => { if (!s.activeWorkout) return s; return { ...s, activeWorkout: { ...s.activeWorkout, exercises: s.activeWorkout.exercises.filter(e => e.name !== exerciseName) } } })
  }, [])

  const addSet = useCallback((exerciseName, set) => {
    setState(s => {
      if (!s.activeWorkout) return s
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, sets: [...e.sets, { id: crypto.randomUUID(), reps: set.reps, weight: set.weight }] } : e) } }
    })
  }, [])

  const updateSet = useCallback((exerciseName, setId, field, value) => {
    setState(s => {
      if (!s.activeWorkout) return s
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, sets: e.sets.map(st => st.id === setId ? { ...st, [field]: value } : st) } : e) } }
    })
  }, [])

  const removeSet = useCallback((exerciseName, setId) => {
    setState(s => {
      if (!s.activeWorkout) return s
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, sets: e.sets.filter(st => st.id !== setId) } : e) } }
    })
  }, [])

  const updateExerciseNotes = useCallback((exerciseName, notes) => {
    setState(s => {
      if (!s.activeWorkout) return s
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, notes } : e) } }
    })
  }, [])

  const toggleReadyToMoveUp = useCallback((exerciseName) => {
    setState(s => {
      if (!s.activeWorkout) return s
      return { ...s, activeWorkout: { ...s.activeWorkout, exercises: s.activeWorkout.exercises.map(e => e.name === exerciseName ? { ...e, readyToMoveUp: !e.readyToMoveUp } : e) } }
    })
  }, [])

  const finishWorkout = useCallback(() => {
    setState(s => {
      if (!s.activeWorkout) return s
      const completed = { ...s.activeWorkout, endTime: Date.now(), date: new Date().toISOString().slice(0, 10) }
      return { ...s, workouts: [completed, ...s.workouts], activeWorkout: null }
    })
  }, [])

  const discardWorkout = useCallback(() => {
    setState(s => ({ ...s, activeWorkout: null }))
  }, [])

  const deleteWorkout = useCallback((id) => {
    setState(s => ({ ...s, workouts: s.workouts.filter(w => w.id !== id) }))
  }, [])

  const softDeleteWorkout = useCallback((id) => {
    setState(s => {
      const workout = s.workouts.find(w => w.id === id)
      if (!workout) return s
      return {
        ...s,
        workouts: s.workouts.filter(w => w.id !== id),
        recentlyDeleted: [{ ...workout, deletedAt: Date.now() }, ...(s.recentlyDeleted || [])],
      }
    })
  }, [])

  const restoreDeletedWorkout = useCallback((id) => {
    setState(s => {
      const workout = (s.recentlyDeleted || []).find(w => w.id === id)
      if (!workout) return s
      const { deletedAt, ...clean } = workout
      return {
        ...s,
        recentlyDeleted: (s.recentlyDeleted || []).filter(w => w.id !== id),
        workouts: [clean, ...s.workouts],
      }
    })
  }, [])

  const permanentDeleteWorkout = useCallback((id) => {
    setState(s => ({ ...s, recentlyDeleted: (s.recentlyDeleted || []).filter(w => w.id !== id) }))
  }, [])

  const archiveWorkout = useCallback((id) => {
    setState(s => {
      const workout = s.workouts.find(w => w.id === id)
      if (!workout) return s
      return {
        ...s,
        workouts: s.workouts.filter(w => w.id !== id),
        archivedWorkouts: [{ ...workout, archivedAt: Date.now() }, ...(s.archivedWorkouts || [])],
      }
    })
  }, [])

  const unarchiveWorkout = useCallback((id) => {
    setState(s => {
      const workout = (s.archivedWorkouts || []).find(w => w.id === id)
      if (!workout) return s
      const { archivedAt, ...clean } = workout
      return {
        ...s,
        archivedWorkouts: (s.archivedWorkouts || []).filter(w => w.id !== id),
        workouts: [clean, ...s.workouts],
      }
    })
  }, [])

  // ── Home Tiles ─────────────────────────────────────────────────────────────
  const saveHomeTile = useCallback((name, exerciseNames) => {
    setState(s => ({
      ...s,
      savedHomeTiles: [
        ...(s.savedHomeTiles || []).filter(t => t.name !== name),
        { id: crypto.randomUUID(), name, exercises: exerciseNames },
      ],
    }))
  }, [])

  const deleteHomeTile = useCallback((id) => {
    setState(s => ({ ...s, savedHomeTiles: (s.savedHomeTiles || []).filter(t => t.id !== id) }))
  }, [])

  // ── Templates ──────────────────────────────────────────────────────────────
  const saveTemplate = useCallback((name, split, exerciseNames) => {
    setState(s => ({ ...s, templates: [...s.templates.filter(t => t.name !== name), { id: crypto.randomUUID(), name, split, exercises: exerciseNames }] }))
  }, [])

  const deleteTemplate = useCallback((id) => {
    setState(s => ({ ...s, templates: s.templates.filter(t => t.id !== id) }))
  }, [])

  const startFromTemplate = useCallback((template) => {
    setState(s => ({ ...s, activeWorkout: { id: crypto.randomUUID(), split: template.split, name: template.name, startTime: Date.now(), exercises: template.exercises.map(name => ({ name, sets: [], readyToMoveUp: false, notes: '' })) } }))
  }, [])

  // ── Custom Exercises ───────────────────────────────────────────────────────
  const addCustomExercise = useCallback((exercise) => {
    setState(s => ({ ...s, customExercises: [...s.customExercises, { ...exercise, custom: true }] }))
  }, [])

  // ── Social ─────────────────────────────────────────────────────────────────
  const sendFriendRequest = useCallback((targetUsername) => {
    if (!state.currentUser || !targetUsername || targetUsername === state.currentUser) return
    // Add to my sent list
    setState(s => ({
      ...s,
      friendRequests: {
        ...s.friendRequests,
        sent: [...new Set([...(s.friendRequests?.sent || []), targetUsername])],
      },
    }))
    // Write to target's received list
    const targetData = loadData(targetUsername)
    saveData(targetUsername, {
      ...targetData,
      friendRequests: {
        ...(targetData.friendRequests || {}),
        received: [...new Set([...(targetData.friendRequests?.received || []), state.currentUser])],
      },
    })
  }, [state.currentUser])

  const acceptFriendRequest = useCallback((fromUsername) => {
    setState(s => ({
      ...s,
      friends: [...new Set([...(s.friends || []), fromUsername])],
      friendRequests: {
        ...s.friendRequests,
        received: (s.friendRequests?.received || []).filter(u => u !== fromUsername),
      },
    }))
    // Mutually add friendship + clear their sent request
    const fromData = loadData(fromUsername)
    saveData(fromUsername, {
      ...fromData,
      friends: [...new Set([...(fromData.friends || []), state.currentUser])],
      friendRequests: {
        ...(fromData.friendRequests || {}),
        sent: (fromData.friendRequests?.sent || []).filter(u => u !== state.currentUser),
      },
    })
  }, [state.currentUser])

  const rejectFriendRequest = useCallback((fromUsername) => {
    setState(s => ({
      ...s,
      friendRequests: {
        ...s.friendRequests,
        received: (s.friendRequests?.received || []).filter(u => u !== fromUsername),
      },
    }))
    const fromData = loadData(fromUsername)
    saveData(fromUsername, {
      ...fromData,
      friendRequests: {
        ...(fromData.friendRequests || {}),
        sent: (fromData.friendRequests?.sent || []).filter(u => u !== state.currentUser),
      },
    })
  }, [state.currentUser])

  const cancelFriendRequest = useCallback((targetUsername) => {
    setState(s => ({
      ...s,
      friendRequests: {
        ...s.friendRequests,
        sent: (s.friendRequests?.sent || []).filter(u => u !== targetUsername),
      },
    }))
    const targetData = loadData(targetUsername)
    saveData(targetUsername, {
      ...targetData,
      friendRequests: {
        ...(targetData.friendRequests || {}),
        received: (targetData.friendRequests?.received || []).filter(u => u !== state.currentUser),
      },
    })
  }, [state.currentUser])

  const unfriend = useCallback((username) => {
    setState(s => ({ ...s, friends: (s.friends || []).filter(u => u !== username) }))
    const otherData = loadData(username)
    saveData(username, { ...otherData, friends: (otherData.friends || []).filter(u => u !== state.currentUser) })
  }, [state.currentUser])

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
    switchUser, createUser, deleteUserAccount,
    startWorkout, addExerciseToWorkout, removeExerciseFromWorkout,
    addSet, updateSet, removeSet, toggleReadyToMoveUp, updateExerciseNotes,
    finishWorkout, discardWorkout, deleteWorkout,
    softDeleteWorkout, restoreDeletedWorkout, permanentDeleteWorkout,
    archiveWorkout, unarchiveWorkout,
    saveHomeTile, deleteHomeTile,
    saveTemplate, deleteTemplate, startFromTemplate,
    addCustomExercise,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, unfriend,
    getExerciseHistory, getPersonalRecord, getWorkoutDates,
  }
}
