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

function loadData(username) {
  if (!username) return defaultState()
  try { const r = localStorage.getItem(dataKey(username)); return r ? JSON.parse(r) : defaultState() }
  catch { return defaultState() }
}

function saveData(username, data) {
  if (!username) return
  localStorage.setItem(dataKey(username), JSON.stringify(data))
}

function defaultState() {
  return { workouts: [], activeWorkout: null, templates: [], customExercises: [] }
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
    addSet, updateSet, removeSet, toggleReadyToMoveUp,
    finishWorkout, discardWorkout, deleteWorkout,
    saveTemplate, deleteTemplate, startFromTemplate,
    addCustomExercise,
    getExerciseHistory, getPersonalRecord, getWorkoutDates,
  }
}
