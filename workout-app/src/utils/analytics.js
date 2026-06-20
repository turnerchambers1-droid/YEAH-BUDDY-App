// Lightweight localStorage event tracker for developer UX analysis.
// Stores up to MAX_EVENTS chronological events; no server involved.

const STORAGE_KEY = 'yb_dev_events'
const MAX_EVENTS  = 2000

export const EV = {
  TAB_VISIT:         'tab_visit',
  WORKOUT_STARTED:   'workout_started',
  WORKOUT_FINISHED:  'workout_finished',
  FINISH_CANCELLED:  'finish_cancelled',
  WORKOUT_EDITED:    'workout_edited',
  SELECTOR_OPENED:   'selector_opened',
  EXERCISE_ADDED:    'exercise_added',
  EXERCISE_REMOVED:  'exercise_removed',
  TIMER_TRIGGERED:   'timer_triggered',
  MOVE_UP_TOGGLED:   'move_up_toggled',
  NOTES_USED:        'notes_used',
  CHIP_USED:         'chip_used',
}

export function track(type, data = {}) {
  try {
    const events = readEvents()
    events.push({ type, ts: Date.now(), ...data })
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {}
}

export function readEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

export function clearEvents() {
  localStorage.removeItem(STORAGE_KEY)
}
