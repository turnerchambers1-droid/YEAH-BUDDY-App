import { useState, useEffect, useRef, useCallback } from 'react'
import { track, EV } from '../utils/analytics'
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowUpCircle, X, Pencil, Archive, Edit3, Zap, Dumbbell } from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { SPLIT_LABELS, EXERCISES, parseExerciseDisplay, inferEquipment, EQUIP_COLORS } from '../data/exercises'
import ExerciseSelector from './ExerciseSelector'
import RestTimer from './RestTimer'
import { useWgerGif } from '../utils/wgerGif'

// ── Small exercise row for workout card preview ───────────────────────────
function ExercisePreviewRow({ exercise }) {
  const gif = useWgerGif(exercise.name)
  const topSet = exercise.sets.length > 0
    ? exercise.sets.reduce((best, s) => (Number(s.weight) >= Number(best.weight) ? s : best), exercise.sets[0])
    : null

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#2a2a2a' }}>
        {gif
          ? <img src={gif} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-4 h-4 rounded-sm" style={{ background: '#3a3a3a' }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-semibold truncate">{exercise.name}</div>
        {topSet && (
          <div className="text-xs" style={{ color: '#555' }}>
            {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
            {topSet.weight === 'BW' ? ' · BW' : topSet.weight ? ` · ${topSet.weight} lbs` : ''}
            {topSet.reps ? ` × ${topSet.reps}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// Epley 1RM estimate
function estimate1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0
  return Math.round(Number(weight) * (1 + Number(reps) / 30))
}

// Weight suggestion based on reps and 1RM
function suggestWeight(oneRM, reps) {
  if (!oneRM || !reps) return null
  const factors = { 1: 1.0, 2: 0.95, 3: 0.93, 4: 0.90, 5: 0.87, 6: 0.85, 7: 0.83, 8: 0.80, 9: 0.77, 10: 0.75, 11: 0.72, 12: 0.67, 13: 0.65, 14: 0.62, 15: 0.60 }
  const factor = factors[Math.min(Number(reps), 15)] || 0.60
  return Math.round(oneRM * factor / 2.5) * 2.5
}

// Rotating daily tagline
function getDailyTagline() {
  const h   = new Date().getHours()
  const day = new Date().getDate()
  const morning   = ['Good morning, handsome 💪', 'Rise and grind, king 👑', 'Early bird gets the gains ☀️', 'Morning pump hits different 🌅']
  const afternoon = ['No excuses, get in here 🔥', 'Get up, lazy bum 🦁', 'Time to earn it 💯', 'Midday grind, let\'s go ⚡']
  const evening   = ['Get in loser, we\'re going lifting 🚗', 'Evening grind is underrated 🌙', 'Last one of the day — make it count 🎯', 'Champions don\'t skip night sessions 🏆']
  const pool = h >= 5 && h < 12 ? morning : h >= 12 && h < 18 ? afternoon : evening
  return pool[day % pool.length]
}

// Descriptor tags that duplicate the editable equipment badge — the badge already
// shows this info and is the one the user can edit, so drop the matching tag chip.
const EQUIP_TAG_MAP = { KB: 'KB', DB: 'DB', BB: 'BB', EZ: 'EZ', Cable: 'Cable', Machine: 'Machine', MAG: 'Cable', HB: 'BB' }

// ── Exercise name display with equipment descriptor tags ──────────────────
function ExerciseNameDisplay({ name, currentEquip }) {
  const { displayName, tags: rawTags } = parseExerciseDisplay(name)
  const tags = rawTags.filter(tag => EQUIP_TAG_MAP[tag] !== currentEquip)
  const TAG_COLORS = {
    KB: { bg: '#a78bfa22', color: '#a78bfa' },
    DB: { bg: '#3b82f622', color: '#3b82f6' },
    BB: { bg: '#f59e0b22', color: '#f59e0b' },
    SA: { bg: '#22d3ee22', color: '#22d3ee' },
    EZ: { bg: '#f43f5e22', color: '#f43f5e' },
    Cable: { bg: '#f9731622', color: '#f97316' },
    Machine: { bg: '#22d3ee22', color: '#22d3ee' },
    MAG: { bg: '#f9731622', color: '#f97316' },
    DA: { bg: '#22d3ee22', color: '#22d3ee' },
    SL: { bg: '#84cc1622', color: '#84cc16' },
    HB: { bg: '#f59e0b22', color: '#f59e0b' },
  }
  return (
    <span className="flex items-center gap-1.5 flex-wrap min-w-0">
      <span className="text-white font-bold" style={{ fontSize: 15 }}>{displayName}</span>
      {tags.map(tag => {
        const c = TAG_COLORS[tag] || { bg: '#2a2a2a', color: '#888' }
        return (
          <span key={tag} className="text-xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{ background: c.bg, color: c.color }}>
            {tag}
          </span>
        )
      })}
    </span>
  )
}

// ── Floating input chips ───────────────────────────────────────────────────
function ChipBar({ chips, onChip }) {
  return (
    <div className="flex gap-2 flex-wrap mt-1.5">
      {chips.map(chip => (
        <button
          key={chip.label}
          onMouseDown={e => { e.preventDefault(); onChip(chip.value) }}
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}

// ── Set row ────────────────────────────────────────────────────────────────
function SetRow({ set, index, onUpdate, onRemove, lastSessionSet, exerciseHistory }) {
  const [focusedField, setFocusedField] = useState(null)

  const currentReps = Number(set.reps) || 0
  const repChips = [
    ...(currentReps > 1 ? [{ label: '−1', value: String(currentReps - 1) }] : []),
    { label: '8',  value: '8' },
    { label: '10', value: '10' },
    { label: '12', value: '12' },
    { label: '15', value: '15' },
    { label: '+1', value: String(currentReps + 1) },
  ]

  const isBW = set.weight === 'BW'
  const currentWeight = isBW ? 0 : (Number(set.weight) || 0)
  const weightChips = isBW
    ? [{ label: 'Clear BW', value: '' }]
    : [
        { label: 'BW',   value: 'BW' },
        ...(currentWeight >= 5   ? [{ label: '-5',   value: String(currentWeight - 5) }]   : []),
        ...(currentWeight >= 2.5 ? [{ label: '-2.5', value: String(currentWeight - 2.5) }] : []),
        { label: '+2.5', value: String(currentWeight + 2.5) },
        { label: '+5',   value: String(currentWeight + 5) },
        { label: '+10',  value: String(currentWeight + 10) },
      ]

  // 1RM-based weight suggestion when reps are set
  let oneRMSuggestion = null
  let historySuggestion = null

  if (currentReps > 0 && exerciseHistory && exerciseHistory.length > 0) {
    const last = exerciseHistory[exerciseHistory.length - 1]
    if (last && last.sets && last.sets.length > 0) {
      const lastSet = last.sets.reduce((best, s) => (Number(s.weight) > Number(best.weight) ? s : best), last.sets[0])
      const lastWeight = Number(lastSet.weight)
      const lastReps = Number(lastSet.reps)
      if (lastWeight > 0) {
        const oneRM = estimate1RM(lastWeight, lastReps)
        const suggested = suggestWeight(oneRM, currentReps)
        if (suggested && suggested !== currentWeight) {
          oneRMSuggestion = { weight: suggested, label: `~${suggested} lbs (${currentReps} rep est.)` }
          historySuggestion = { weight: lastWeight, reps: lastReps, label: `${lastWeight} lbs × ${lastReps} last time` }
        }
      }
    }
  }

  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-5 text-center" style={{ color: '#555' }}>{index + 1}</span>
        <div className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="lbs"
              value={set.weight || ''}
              onChange={e => onUpdate('weight', e.target.value)}
              onFocus={() => setFocusedField('weight')}
              onBlur={() => setFocusedField(null)}
              className="w-full text-center rounded-lg py-2 text-sm font-semibold outline-none text-white"
              style={{ background: isBW ? '#22c55e22' : '#2a2a2a', fontSize: 16, color: isBW ? '#22c55e' : '#fff' }}
            />
            {!isBW && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#444' }}>lbs</span>}
          </div>
          <div className="flex-1 relative">
            <input
              type="number"
              inputMode="numeric"
              placeholder="reps"
              value={set.reps || ''}
              onChange={e => onUpdate('reps', e.target.value)}
              onFocus={() => setFocusedField('reps')}
              onBlur={() => setFocusedField(null)}
              className="w-full text-center rounded-lg py-2 text-sm font-semibold outline-none text-white"
              style={{ background: '#2a2a2a', fontSize: 16 }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#444' }}>reps</span>
          </div>
        </div>
        <button onClick={onRemove} className="p-1.5 rounded-lg" style={{ color: '#555' }}><Trash2 size={15} /></button>
      </div>

      {/* Chips: reps suggestions */}
      {focusedField === 'reps' && (
        <div className="ml-7 mt-1">
          <ChipBar chips={repChips} onChip={v => onUpdate('reps', v)} />
        </div>
      )}

      {/* Chips: weight increments */}
      {focusedField === 'weight' && (
        <div className="ml-7 mt-1">
          <ChipBar chips={weightChips} onChip={v => onUpdate('weight', v)} />
        </div>
      )}

      {/* Weight suggestions when reps are entered and weight is empty */}
      {currentReps > 0 && !currentWeight && (historySuggestion || oneRMSuggestion) && (
        <div className="ml-7 mt-1 flex flex-col gap-1">
          {historySuggestion && (
            <button
              onMouseDown={e => { e.preventDefault(); onUpdate('weight', String(historySuggestion.weight)) }}
              className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}
            >
              📊 {historySuggestion.label}
            </button>
          )}
          {oneRMSuggestion && (
            <button
              onMouseDown={e => { e.preventDefault(); onUpdate('weight', String(oneRMSuggestion.weight)) }}
              className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}
            >
              ⚡ {oneRMSuggestion.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Exercise card ──────────────────────────────────────────────────────────
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine', 'Bodyweight', 'Other']

function EquipBadge({ eq }) {
  const c = EQUIP_COLORS[eq]
  if (!c) return null
  return (
    <span className="flex-shrink-0 font-bold rounded" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 10, padding: '2px 6px', letterSpacing: '0.03em' }}>
      {eq}
    </span>
  )
}

function ExerciseCard({ exercise, onAddSet, onUpdateSet, onRemoveSet, onToggleMoveUp, onRemove, onUpdateNotes, onRename, onEditEquipment, pr, exerciseHistory, expanded, onToggleExpand }) {
  const [showLastSession, setShowLastSession] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editingEquip, setEditingEquip] = useState(false)
  const [nameInput, setNameInput] = useState(exercise.name)
  const confirmTimer = useRef(null)

  const currentEquip = inferEquipment(exercise)

  const maxWeight = exercise.sets.length > 0 ? Math.max(...exercise.sets.map(s => Number(s.weight) || 0)) : 0
  const hasBWNow = exercise.sets.some(s => s.weight === 'BW')
  const hadBWBefore = exerciseHistory?.some(h => h.hasBW) || false
  const isBWPR = hasBWNow && !hadBWBefore
  const isPR = (maxWeight > 0 && maxWeight > pr) || isBWPR

  const lastSessions = exerciseHistory ? exerciseHistory.slice(-3).reverse() : []
  const lastSession = lastSessions[0] || null
  const lastSet = lastSession?.sets?.[lastSession.sets.length - 1] || null
  const lastSetWeight = lastSet?.weight || ''
  const lastSetReps = lastSet?.reps || 0
  const showLastBadge = !!(lastSet && (lastSetWeight === 'BW' || Number(lastSetWeight) > 0))
  const showPrevReadyToMoveUp = !!(lastSession?.readyToMoveUp && !exercise.readyToMoveUp)

  const handleRename = () => {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== exercise.name && onRename) {
      onRename(exercise.name, trimmed)
    }
    setEditingName(false)
  }

  const handleRemovePress = () => {
    if (confirmRemove) {
      clearTimeout(confirmTimer.current)
      onRemove(exercise.name)
    } else {
      setConfirmRemove(true)
      confirmTimer.current = setTimeout(() => setConfirmRemove(false), 3000)
    }
  }

  const GOAL_REPS = '15'

  const handleAddSet = () => {
    const last = exercise.sets[exercise.sets.length - 1]
    const defaultWeight = last?.weight || (exercise.sets.length === 0 ? (lastSetWeight || '') : '')
    onAddSet(exercise.name, { weight: defaultWeight, reps: GOAL_REPS })
  }

  return (
    <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#141414' }}>
      <div className="flex items-center justify-between px-4 py-3">
        {editingName ? (
          <>
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                if (e.key === 'Enter') e.target.blur()
                if (e.key === 'Escape') { setNameInput(exercise.name); setEditingName(false) }
              }}
              className="flex-1 text-white font-bold rounded-lg px-2 py-1 outline-none mr-2"
              style={{ background: '#1e1e1e', fontSize: 15, border: '1px solid #22c55e44' }}
            />
            <button onClick={handleRename} className="px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0"
              style={{ background: '#22c55e22', color: '#22c55e' }}>
              Done
            </button>
          </>
        ) : (
          <>
            <button className="flex-1 flex items-center gap-2 text-left min-w-0" onClick={onToggleExpand}>
              <ExerciseNameDisplay name={exercise.name} currentEquip={currentEquip} />
              {currentEquip && <EquipBadge eq={currentEquip} />}
              {isPR && <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#22c55e22', color: '#22c55e' }}>PR!</span>}
              {showPrevReadyToMoveUp && <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1" style={{ background: '#00d4ff22', color: '#00d4ff' }}><ArrowUpCircle size={11} /> Up weight</span>}
              {exercise.sets.length > 0 && <span className="text-xs flex-shrink-0" style={{ color: '#555' }}>{exercise.sets.length} set{exercise.sets.length > 1 ? 's' : ''}</span>}
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => { setNameInput(exercise.name); setEditingName(true) }}
                className="p-1.5 rounded-lg" style={{ color: '#444' }}>
                <Pencil size={14} />
              </button>
              <button onClick={() => setEditingEquip(v => !v)} title="Edit equipment"
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: editingEquip ? '#22c55e22' : 'transparent', color: editingEquip ? '#22c55e' : '#444' }}>
                <Dumbbell size={14} />
              </button>
              <button onClick={() => onToggleMoveUp(exercise.name)} title="Ready to move up in weight"
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: exercise.readyToMoveUp ? '#00d4ff22' : 'transparent', color: exercise.readyToMoveUp ? '#00d4ff' : '#444' }}>
                <ArrowUpCircle size={18} />
              </button>
              <button onClick={handleRemovePress}
                className="p-2.5 rounded-lg transition-all"
                style={{ color: confirmRemove ? '#ef4444' : '#444', background: confirmRemove ? '#ef444418' : 'transparent' }}>
                {confirmRemove ? <span className="text-xs font-bold" style={{ color: '#ef4444' }}>remove?</span> : <X size={18} />}
              </button>
              <button onClick={onToggleExpand} style={{ color: '#444' }}>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Equipment editor — mirrors name editing */}
      {editingEquip && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-xl flex flex-wrap gap-1.5" style={{ background: '#1a1a1a' }}>
          {EQUIPMENT_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => { onEditEquipment(exercise.name, opt); setEditingEquip(false) }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: exercise.equipment === opt ? '#22c55e22' : '#2a2a2a',
                color: exercise.equipment === opt ? '#22c55e' : '#888',
                border: exercise.equipment === opt ? '1px solid #22c55e44' : '1px solid transparent',
              }}
            >{opt}</button>
          ))}
          {exercise.equipment && (
            <button
              onClick={() => { onEditEquipment(exercise.name, null); setEditingEquip(false) }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: '#2a2a2a', color: '#555' }}
            >Clear</button>
          )}
        </div>
      )}

      {/* Last session badge — shows last set of last session */}
      {showLastBadge && (
        <button onClick={() => setShowLastSession(true)} className="mx-4 mb-1 px-3 py-1 rounded-lg flex items-center gap-1.5 text-left" style={{ background: '#1a1a1a' }}>
          <span className="text-xs" style={{ color: '#555' }}>Last: </span>
          <span className="text-xs font-semibold underline decoration-dotted" style={{ color: '#22c55e' }}>
            {lastSetWeight === 'BW' ? 'BW' : `${lastSetWeight} lbs`} × {lastSetReps}
          </span>
          <span className="text-xs" style={{ color: '#444' }}>— tap for last {lastSessions.length}</span>
        </button>
      )}

      {/* Last sessions overlay — shows up to 3 */}
      {showLastSession && lastSessions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowLastSession(false)}>
          <div className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-4"
            style={{ background: 'rgba(18,18,18,0.95)', border: '1px solid #2a2a2a', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-white font-bold text-base">{exercise.name}</div>
              <button onClick={() => setShowLastSession(false)} className="p-1.5 rounded-full" style={{ background: '#2a2a2a', color: '#888' }}>
                <X size={16} />
              </button>
            </div>
            {lastSessions.map((session, si) => (
              <div key={session.date + si}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold" style={{ color: '#22c55e' }}>{si === 0 ? 'Most Recent' : si === 1 ? '2 sessions ago' : '3 sessions ago'}</span>
                  <span className="text-xs" style={{ color: '#555' }}>· {session.date}</span>
                </div>
                <div className="flex gap-2 pb-1 mb-1" style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <div className="w-8 text-xs font-bold" style={{ color: '#555' }}>SET</div>
                  <div className="flex-1 text-xs font-bold text-center" style={{ color: '#555' }}>WEIGHT</div>
                  <div className="flex-1 text-xs font-bold text-center" style={{ color: '#555' }}>REPS</div>
                </div>
                {session.sets.map((s, i) => (
                  <div key={s.id || i} className="flex gap-2 items-center py-0.5">
                    <div className="w-8 text-xs font-mono" style={{ color: '#555' }}>{i + 1}</div>
                    <div className="flex-1 text-center text-sm font-semibold" style={{ color: '#f5f5f5' }}>{s.weight || '—'}{s.weight && s.weight !== 'BW' ? ' lbs' : ''}</div>
                    <div className="flex-1 text-center text-sm font-semibold" style={{ color: '#f5f5f5' }}>{s.reps || '—'}</div>
                  </div>
                ))}
                {si < lastSessions.length - 1 && <div className="mt-3" style={{ borderBottom: '1px solid #1e1e1e' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {exercise.readyToMoveUp && (
        <div className="mx-4 mb-2 px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: '#00d4ff11', border: '1px solid #00d4ff33' }}>
          <ArrowUpCircle size={14} style={{ color: '#00d4ff' }} />
          <span className="text-xs font-semibold" style={{ color: '#00d4ff' }}>Ready to increase weight next session</span>
        </div>
      )}

      {showPrevReadyToMoveUp && (
        <div className="mx-4 mb-2 px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: '#00d4ff11', border: '1px solid #00d4ff33' }}>
          <ArrowUpCircle size={14} style={{ color: '#00d4ff' }} />
          <span className="text-xs font-semibold" style={{ color: '#00d4ff' }}>You flagged this to increase weight last session — try going up</span>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-3">
          {exercise.sets.length > 0 && (
            <div className="flex gap-2 mb-1">
              <div className="w-5" />
              <div className="flex-1 text-center text-xs font-semibold" style={{ color: '#555' }}>WEIGHT</div>
              <div className="flex-1 text-center text-xs font-semibold" style={{ color: '#555' }}>REPS</div>
              <div className="w-8" />
            </div>
          )}
          {exercise.sets.map((set, i) => (
            <SetRow
              key={set.id}
              set={set}
              index={i}
              onUpdate={(field, val) => onUpdateSet(exercise.name, set.id, field, val)}
              onRemove={() => onRemoveSet(exercise.name, set.id)}
              exerciseHistory={exerciseHistory}
            />
          ))}
          <button onClick={handleAddSet}
            className="w-full mt-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            style={{ background: '#1e1e1e', color: '#22c55e' }}>
            <Plus size={15} /> Add Set
          </button>
          {/* Notes */}
          <textarea
            placeholder="Notes: setup, machine settings, cues..."
            value={exercise.notes || ''}
            onChange={e => onUpdateNotes(exercise.name, e.target.value)}
            rows={2}
            className="w-full mt-3 px-3 py-2 rounded-xl text-white resize-none outline-none"
            style={{ background: '#1a1a1a', fontSize: 14, color: '#aaa', border: '1px solid #2a2a2a', lineHeight: 1.5 }}
          />
        </div>
      )}
    </div>
  )
}

// ── Long-press + swipe gesture hook ───────────────────────────────────────
function useGestures(onLongPress) {
  const pressTimer = useRef(null)
  const startX     = useRef(null)
  const [swiped, setSwiped] = useState(false)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    setSwiped(false)
    pressTimer.current = setTimeout(() => { onLongPress() }, 500)
  }, [onLongPress])

  const onTouchMove = useCallback((e) => {
    clearTimeout(pressTimer.current)
    if (startX.current !== null) {
      const dx = startX.current - e.touches[0].clientX
      if (dx > 60) setSwiped(true)
      else if (dx < 0) setSwiped(false)
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    clearTimeout(pressTimer.current)
  }, [])

  return { swiped, setSwiped, handlers: { onTouchStart, onTouchMove, onTouchEnd } }
}

// ── Workout card with 3-option menu + expandable exercises ───────────────
function WorkoutCard({ workout, onSoftDelete, onArchive, onStartAgain, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { swiped, setSwiped, handlers } = useGestures(() => setMenuOpen(true))

  const duration = workout.endTime
    ? Math.round((workout.endTime - workout.startTime) / 60000)
    : null

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
        {/* Swipe wrapper */}
        <div className="relative overflow-hidden" {...handlers}>
          {/* Swipe-reveal action strip */}
          <div
            className="absolute right-0 top-0 bottom-0 flex items-center gap-1 px-2"
            style={{ background: '#1e1e1e', transform: swiped ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.2s', width: 120 }}
          >
            <button
              onClick={() => { onEdit(workout); setSwiped(false) }}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl"
              style={{ background: '#2a2a2a' }}
            >
              <Edit3 size={15} color="#888" />
              <span className="text-xs" style={{ color: '#888', fontSize: 9 }}>Edit</span>
            </button>
            <button
              onClick={() => { onArchive(workout.id); setSwiped(false) }}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl"
              style={{ background: '#2a2a2a' }}
            >
              <Archive size={15} color="#888" />
              <span className="text-xs" style={{ color: '#888', fontSize: 9 }}>Archive</span>
            </button>
            <button
              onClick={() => { setSwiped(false); setConfirmDelete(true) }}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl"
              style={{ background: '#ef444422' }}
            >
              <Trash2 size={15} color="#ef4444" />
              <span className="text-xs" style={{ color: '#ef4444', fontSize: 9 }}>Delete</span>
            </button>
          </div>

          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ transform: swiped ? 'translateX(-120px)' : 'translateX(0)', transition: 'transform 0.2s' }}
            onClick={() => { if (!swiped) setExpanded(e => !e) }}
          >
            <div>
              <div className="text-white font-semibold text-sm">
                {workout.name || SPLIT_LABELS[workout.split] || workout.split}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                {workout.date} · {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {duration !== null && (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#22c55e11', color: '#22c55e' }}>{duration}m</span>
              )}
              {swiped
                ? <button onClick={e => { e.stopPropagation(); setSwiped(false) }} style={{ color: '#555' }}><X size={14} /></button>
                : <span style={{ color: '#444' }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              }
            </div>
          </button>
        </div>

        {/* Expanded exercise list */}
        {expanded && workout.exercises.length > 0 && (
          <div className="px-4 pb-3" style={{ borderTop: '1px solid #1e1e1e' }}>
            {workout.exercises.map(ex => (
              <ExercisePreviewRow key={ex.name} exercise={ex} />
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
            <div>
              <div className="text-white font-bold text-lg">Delete workout?</div>
              <div className="text-sm mt-1" style={{ color: '#888' }}>
                {workout.name || SPLIT_LABELS[workout.split] || workout.split} · {workout.date}
              </div>
              <div className="text-xs mt-2" style={{ color: '#555' }}>Recoverable from Recently Deleted for 3 days.</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#2a2a2a', color: '#888' }}>Cancel</button>
              <button
                onClick={() => { onSoftDelete(workout.id); setConfirmDelete(false) }}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm"
                style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 3-option menu modal */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center px-4 pb-8">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col" style={{ background: '#141414' }}>
            <div className="px-5 pt-5 pb-3">
              <div className="text-white font-bold">{workout.name || SPLIT_LABELS[workout.split] || workout.split}</div>
              <div className="text-xs mt-0.5" style={{ color: '#555' }}>{workout.date} · {workout.exercises.length} exercises</div>
            </div>
            <div style={{ borderTop: '1px solid #1e1e1e' }}>
              <button
                onClick={() => { onEdit(workout); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-white/5"
                style={{ borderBottom: '1px solid #1e1e1e' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#3b82f622' }}>
                  <Edit3 size={17} color="#3b82f6" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Edit</div>
                  <div className="text-xs" style={{ color: '#555' }}>Change sets, weights, exercises, or name</div>
                </div>
              </button>
              <button
                onClick={() => { onStartAgain(workout); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-white/5"
                style={{ borderBottom: '1px solid #1e1e1e' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#22c55e22' }}>
                  <Zap size={17} color="#22c55e" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Start Again</div>
                  <div className="text-xs" style={{ color: '#555' }}>Create new workout with these exercises</div>
                </div>
              </button>
              <button
                onClick={() => { onArchive(workout.id); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-white/5"
                style={{ borderBottom: '1px solid #1e1e1e' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#88888822' }}>
                  <Archive size={17} color="#888" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Archive</div>
                  <div className="text-xs" style={{ color: '#555' }}>Hide from home, accessible in settings</div>
                </div>
              </button>
              <button
                onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-white/5"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#ef444422' }}>
                  <Trash2 size={17} color="#ef4444" />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#ef4444' }}>Delete</div>
                  <div className="text-xs" style={{ color: '#555' }}>Moves to Recently Deleted · auto-purges in 3 days</div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full py-4 font-semibold text-sm"
              style={{ color: '#888', borderTop: '1px solid #1e1e1e' }}
            >Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Workout edit modal ─────────────────────────────────────────────────────
function WorkoutEditModal({ workout, onSave, onClose }) {
  const [name, setName]   = useState(workout.name || '')
  const [date, setDate]   = useState(workout.date || '')
  const [split, setSplit] = useState(workout.split || 'custom')
  const [durationMins, setDurationMins] = useState(
    workout.endTime && workout.startTime
      ? String(Math.round((workout.endTime - workout.startTime) / 60000))
      : ''
  )
  const [exercises, setExercises] = useState(
    workout.exercises.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) }))
  )
  const [showSelector, setShowSelector] = useState(false)
  const [editingExName, setEditingExName] = useState(null)
  const [exNameInput, setExNameInput] = useState('')

  const renameExercise = (oldName, newName) => {
    const trimmed = newName.trim()
    if (!trimmed || exercises.find(e => e.name === trimmed && e.name !== oldName)) {
      setEditingExName(null)
      return
    }
    setExercises(exs => exs.map(ex => ex.name === oldName ? { ...ex, name: trimmed } : ex))
    setEditingExName(null)
  }

  const updateSet = (exName, setId, field, val) => {
    setExercises(exs => exs.map(ex => ex.name === exName
      ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: val } : s) }
      : ex
    ))
  }

  const removeSet = (exName, setId) => {
    setExercises(exs => exs.map(ex => ex.name === exName
      ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
      : ex
    ))
  }

  const addSet = (exName) => {
    setExercises(exs => exs.map(ex => {
      if (ex.name !== exName) return ex
      const last = ex.sets[ex.sets.length - 1]
      return { ...ex, sets: [...ex.sets, { id: crypto.randomUUID(), weight: last?.weight || '', reps: last?.reps || '' }] }
    }))
  }

  const removeExercise = (exName) => setExercises(exs => exs.filter(ex => ex.name !== exName))

  const addExercise = (exName) => {
    if (exercises.find(e => e.name === exName)) return
    setExercises(exs => [...exs, { name: exName, sets: [{ id: crypto.randomUUID(), weight: '', reps: '' }], notes: '' }])
  }

  const handleSave = () => {
    const mins = parseInt(durationMins)
    const endTime = !isNaN(mins) && mins > 0 && workout.startTime
      ? workout.startTime + mins * 60000
      : workout.endTime
    onSave({ name: name.trim() || null, date, split, exercises, endTime })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
          <span className="text-white font-semibold text-lg flex-1">Edit Workout</span>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#22c55e', color: '#000' }}>Save</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: '#555' }}>Workout Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Push Day, Leg Blast…"
              className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#141414', fontSize: 16 }} />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: '#555' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#141414', fontSize: 16, colorScheme: 'dark' }} />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: '#555' }}>Duration (minutes)</label>
            <input type="number" inputMode="numeric" value={durationMins}
              onChange={e => setDurationMins(e.target.value)}
              placeholder="e.g. 45"
              className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#141414', fontSize: 16 }} />
          </div>

          {/* Split / workout type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#555' }}>Workout Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[...Object.entries(SPLIT_LABELS), ['custom', 'Custom']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSplit(key)}
                  className="py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: split === key ? '#22c55e22' : '#141414',
                    color: split === key ? '#22c55e' : '#888',
                    border: split === key ? '1px solid #22c55e44' : '1px solid #1e1e1e',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#555' }}>Exercises</label>
            {exercises.map(ex => (
              <div key={ex.name} className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#141414' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
                  {editingExName === ex.name ? (
                    <input
                      autoFocus
                      type="text"
                      value={exNameInput}
                      onChange={e => setExNameInput(e.target.value)}
                      onBlur={() => renameExercise(ex.name, exNameInput)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') renameExercise(ex.name, exNameInput)
                        if (e.key === 'Escape') setEditingExName(null)
                      }}
                      className="flex-1 text-white font-semibold text-sm rounded-lg px-2 py-1 outline-none mr-2"
                      style={{ background: '#1e1e1e', fontSize: 14, border: '1px solid #22c55e44' }}
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingExName(ex.name); setExNameInput(ex.name) }}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      <span className="text-white font-semibold text-sm truncate">{ex.name}</span>
                      <Pencil size={12} style={{ color: '#444', flexShrink: 0 }} />
                    </button>
                  )}
                  <button onClick={() => removeExercise(ex.name)} style={{ color: '#ef4444', flexShrink: 0 }}><X size={16} /></button>
                </div>

                <div className="px-4 pt-2 pb-3">
                  {/* Column headers */}
                  {ex.sets.length > 0 && (
                    <div className="flex gap-2 mb-1">
                      <div className="w-5" />
                      <div className="flex-1 text-center text-xs font-semibold" style={{ color: '#555' }}>WEIGHT</div>
                      <div className="flex-1 text-center text-xs font-semibold" style={{ color: '#555' }}>REPS</div>
                      <div className="w-8" />
                    </div>
                  )}
                  {ex.sets.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 py-1">
                      <span className="text-xs font-bold w-5 text-center" style={{ color: '#555' }}>{i + 1}</span>
                      <input type="text" inputMode="decimal" value={s.weight} placeholder="lbs"
                        onChange={e => updateSet(ex.name, s.id, 'weight', e.target.value)}
                        className="flex-1 text-center rounded-lg py-2 text-sm font-semibold outline-none text-white"
                        style={{ background: '#2a2a2a', fontSize: 16 }} />
                      <input type="number" inputMode="numeric" value={s.reps} placeholder="reps"
                        onChange={e => updateSet(ex.name, s.id, 'reps', e.target.value)}
                        className="flex-1 text-center rounded-lg py-2 text-sm font-semibold outline-none text-white"
                        style={{ background: '#2a2a2a', fontSize: 16 }} />
                      <button onClick={() => removeSet(ex.name, s.id)} className="p-1" style={{ color: '#555' }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => addSet(ex.name)}
                    className="w-full mt-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                    style={{ background: '#1e1e1e', color: '#22c55e' }}>
                    <Plus size={14} /> Add Set
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => setShowSelector(true)}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
              style={{ background: '#141414', color: '#22c55e', border: '1px dashed #1e1e1e' }}>
              <Plus size={16} /> Add Exercise
            </button>
          </div>
        </div>
      </div>

      {showSelector && (
        <ExerciseSelector
          currentExercises={exercises.map(e => e.name)}
          split={split}
          onSelect={addExercise}
          onClose={() => setShowSelector(false)}
        />
      )}
    </>
  )
}

// ── Custom workout modal ───────────────────────────────────────────────────
function CustomWorkoutModal({ onStart, onClose }) {
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises]     = useState([])
  const [showSelector, setShowSelector] = useState(false)
  const [buildMode, setBuildMode]     = useState(null) // 'build-first' | 'build-as-you-go'

  if (!buildMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.9)' }}>
        <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
          <button onClick={onClose} className="self-end" style={{ color: '#555' }}><X size={20} /></button>
          <div className="text-center">
            <div className="text-white font-bold text-xl mb-1">Custom Workout</div>
            <div className="text-sm" style={{ color: '#555' }}>How do you want to build it?</div>
          </div>
          <button
            onClick={() => setBuildMode('build-first')}
            className="w-full py-4 rounded-2xl font-bold text-base flex flex-col items-center gap-1"
            style={{ background: '#22c55e', color: '#000' }}
          >
            <span>Build First</span>
            <span className="text-xs font-normal opacity-70">Add all exercises, then start</span>
          </button>
          <button
            onClick={() => { onStart('', [], 'build-as-you-go'); onClose() }}
            className="w-full py-4 rounded-2xl font-bold text-base flex flex-col items-center gap-1"
            style={{ background: '#1e1e1e', color: '#fff', border: '1px solid #2a2a2a' }}
          >
            <span>Build As You Go</span>
            <span className="text-xs font-normal" style={{ color: '#555' }}>Start immediately, add exercises mid-session</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3 px-4 pt-14 pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <button onClick={() => setBuildMode(null)} className="text-gray-400 hover:text-white"><X size={22} /></button>
          <span className="text-white font-semibold text-lg flex-1">Custom Workout</span>
          <button
            onClick={() => { if (workoutName.trim()) onStart(workoutName.trim(), exercises, 'build-first') }}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: workoutName.trim() ? '#22c55e' : '#1e1e1e', color: workoutName.trim() ? '#000' : '#555' }}
          >Start</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#555' }}>Workout Name</label>
            <input autoFocus type="text" placeholder='e.g. "Pull Day", "Leg Blast"'
              value={workoutName} onChange={e => setWorkoutName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: '#141414', fontSize: 16 }} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: '#555' }}>
              Exercises ({exercises.length})
            </label>
            {exercises.length > 0 && (
              <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#141414' }}>
                {exercises.map((name, i) => (
                  <div key={name} className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: i < exercises.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                    <span className="text-white text-sm">{name}</span>
                    <button onClick={() => setExercises(e => e.filter(x => x !== name))} style={{ color: '#555' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowSelector(true)}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
              style={{ background: '#141414', color: '#22c55e', border: '1px dashed #1e1e1e' }}>
              <Plus size={18} /> Add Exercise
            </button>
          </div>
        </div>
      </div>

      {showSelector && (
        <ExerciseSelector
          currentExercises={exercises}
          onSelect={name => setExercises(e => [...e, name])}
          onClose={() => setShowSelector(false)}
        />
      )}
    </>
  )
}

// ── Save-as-workout prompt ─────────────────────────────────────────────────
function SaveWorkoutPrompt({ workout, onSave, onDismiss }) {
  const [name, setName] = useState(workout.name || '')
  const [saving, setSaving] = useState(false)

  if (saving) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
          <h2 className="text-white font-bold text-lg">Name this workout</h2>
          <input
            autoFocus
            type="text"
            placeholder='e.g. "Push A", "Upper Body"'
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: '#1e1e1e', fontSize: 16 }}
          />
          <div className="flex gap-3">
            <button onClick={onDismiss} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#2a2a2a', color: '#888' }}>Skip</button>
            <button
              onClick={() => { if (name.trim()) onSave(name.trim()) }}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: name.trim() ? '#22c55e' : '#1e1e1e', color: name.trim() ? '#000' : '#555' }}
            >Save Tile</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
        <h2 className="text-white font-bold text-lg">Save as new workout?</h2>
        <p className="text-sm" style={{ color: '#888' }}>Add this to your home screen for quick access next time.</p>
        <div className="flex gap-3">
          <button onClick={onDismiss} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#2a2a2a', color: '#888' }}>No thanks</button>
          <button onClick={() => setSaving(true)} className="flex-1 py-3 rounded-2xl font-semibold text-sm text-black" style={{ background: '#22c55e' }}>Save it</button>
        </div>
      </div>
    </div>
  )
}

// ── Main WorkoutLogger ─────────────────────────────────────────────────────
export default function WorkoutLogger() {
  const store = useWorkoutStore()
  const [showSelector,      setShowSelector]      = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showCustomModal,   setShowCustomModal]   = useState(false)
  const [showSavePrompt,    setShowSavePrompt]    = useState(false)
  const [elapsed,           setElapsed]           = useState(0)
  const [editingWorkout,    setEditingWorkout]    = useState(null)
  const [expandedExercises, setExpandedExercises] = useState(new Set())
  const [showLastSplit,     setShowLastSplit]     = useState(false)
  const [editingTitle,      setEditingTitle]      = useState(false)
  const [titleInput,        setTitleInput]        = useState('')
  const timerRef = useRef(null)

  const toggleExpanded = useCallback((name) => {
    setExpandedExercises(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  useEffect(() => {
    if (!store.activeWorkout) return
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - store.activeWorkout.startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [store.activeWorkout])

  const fmt = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const handleStartCustom = (name, exerciseNames, mode) => {
    track(EV.WORKOUT_STARTED, { split: 'custom', via: 'custom_modal', mode, preloaded: exerciseNames?.length || 0 })
    store.startWorkout('custom', name || null)
    if (exerciseNames && exerciseNames.length > 0) {
      exerciseNames.forEach(ex => store.addExerciseToWorkout(ex))
    }
    setShowCustomModal(false)
  }

  const handleStartHomeTile = (tile) => {
    track(EV.WORKOUT_STARTED, { split: 'custom', via: 'home_tile', name: tile.name })
    store.startWorkout('custom', tile.name)
    tile.exercises.forEach(ex => store.addExerciseToWorkout(ex))
  }

  const handleStartAgain = (workout) => {
    track(EV.WORKOUT_STARTED, { split: workout.split, via: 'start_again' })
    store.startWorkout(workout.split, workout.name)
    workout.exercises.forEach(ex => store.addExerciseToWorkout(ex.name))
  }

  const handleFinish = () => {
    const aw = store.activeWorkout
    if (aw) {
      track(EV.WORKOUT_FINISHED, {
        split: aw.split,
        exercises: aw.exercises?.length || 0,
        sets: (aw.exercises || []).reduce((s, e) => s + e.sets.length, 0),
        duration: aw.startTime ? Math.round((Date.now() - aw.startTime) / 60000) : null,
        hasNotes: !!(aw.notes?.trim()),
      })
    }
    store.finishWorkout()
    setShowFinishConfirm(false)
    const wasCustom = store.activeWorkout?.split === 'custom'
    if (wasCustom) setShowSavePrompt(true)
  }

  const handleEditWorkout = (workout) => {
    track(EV.WORKOUT_EDITED, { split: workout.split })
    setEditingWorkout(workout)
  }
  const handleSaveEdit = (updates) => {
    if (editingWorkout) store.updateWorkout(editingWorkout.id, updates)
    setEditingWorkout(null)
  }

  const handleSaveHomeTile = (name) => {
    if (store.workouts[0]) {
      store.saveHomeTile(name, store.workouts[0].exercises.map(e => e.name))
    }
    setShowSavePrompt(false)
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!store.activeWorkout) {
    return (
      <>
        <div className="flex flex-col min-h-screen pb-24 pt-14">
          {/* Hero banner */}
          <div className="px-4 pt-6 pb-4 flex flex-col items-center">
            <h1 className="text-5xl font-black tracking-tight text-white" style={{ letterSpacing: '-0.02em' }}>
              YEAH <span style={{ color: '#22c55e' }}>BUDDY</span>
            </h1>
            <p className="text-xs font-semibold mt-1 tracking-wide" style={{ color: '#555' }}>{getDailyTagline()}</p>
          </div>

          {/* Header */}
          <div className="px-4 pt-2 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Start Workout</h2>
              <p className="text-sm mt-0.5" style={{ color: '#555' }}>
                {store.currentUser ? `Hey ${store.currentUser} 👋` : 'Choose your split'}
              </p>
            </div>
          </div>

          {/* Split quick-start grid */}
          <div className="px-4 mt-3 grid grid-cols-2 gap-3">
            {Object.entries(SPLIT_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => { track(EV.WORKOUT_STARTED, { split: key, via: 'split_grid' }); store.startWorkout(key) }}
                className="rounded-2xl p-5 text-left active:scale-95 transition-transform"
                style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
                <div className="text-white font-bold text-base">{label}</div>
                <div className="text-xs mt-1" style={{ color: '#555' }}>Tap to start</div>
              </button>
            ))}

            {/* Custom tile */}
            <button
              onClick={() => setShowCustomModal(true)}
              className="rounded-2xl p-5 text-left active:scale-95 transition-transform"
              style={{ background: '#141414', border: '1px dashed #22c55e55' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Pencil size={14} color="#22c55e" />
                <div className="font-bold text-base" style={{ color: '#22c55e' }}>Custom</div>
              </div>
              <div className="text-xs" style={{ color: '#555' }}>Build your own</div>
            </button>

            {/* Saved home tiles */}
            {(store.savedHomeTiles || []).map(tile => (
              <button key={tile.id} onClick={() => handleStartHomeTile(tile)}
                className="rounded-2xl p-5 text-left active:scale-95 transition-transform"
                style={{ background: '#141414', border: '1px solid #22c55e44' }}>
                <div className="text-white font-bold text-base truncate">{tile.name}</div>
                <div className="text-xs mt-1" style={{ color: '#555' }}>{tile.exercises.length} exercises</div>
              </button>
            ))}
          </div>

          {/* Recent workouts */}
          {store.workouts.length > 0 && (
            <div className="px-4 mt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Recent — swipe left or long press</h2>
              <div className="flex flex-col gap-2">
                {store.workouts.slice(0, 5).map(w => (
                  <WorkoutCard
                    key={w.id}
                    workout={w}
                    onSoftDelete={store.softDeleteWorkout}
                    onArchive={store.archiveWorkout}
                    onStartAgain={handleStartAgain}
                    onEdit={handleEditWorkout}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

        {showCustomModal && (
          <CustomWorkoutModal onStart={handleStartCustom} onClose={() => setShowCustomModal(false)} />
        )}

        {showSavePrompt && (
          <SaveWorkoutPrompt
            workout={store.workouts[0] || {}}
            onSave={handleSaveHomeTile}
            onDismiss={() => setShowSavePrompt(false)}
          />
        )}

        {editingWorkout && (
          <WorkoutEditModal
            workout={editingWorkout}
            onSave={handleSaveEdit}
            onClose={() => setEditingWorkout(null)}
          />
        )}
      </>
    )
  }

  // ── Active workout screen ─────────────────────────────────────────────────
  const { activeWorkout } = store
  const workoutTitle = activeWorkout.name || SPLIT_LABELS[activeWorkout.split] || activeWorkout.split
  const lastSameWorkouts = activeWorkout.split && activeWorkout.split !== 'custom'
    ? store.workouts.filter(w => w.split === activeWorkout.split).slice(0, 3)
    : []

  const renderTimer = () => (
    <div className="mt-2 mb-2">
      <RestTimer ref={timerRef} inline voiceMode={store.voiceMode} />
    </div>
  )

  const renderWorkoutNotes = () => (
    <div className="mt-2 mb-4 rounded-2xl px-4 py-3" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
      <span className="text-xs font-bold tracking-widest uppercase block mb-2" style={{ color: '#c8b97a', fontFamily: 'Courier New, monospace' }}>WORKOUT NOTES</span>
      <textarea
        rows={3}
        placeholder="Add notes for this workout..."
        value={activeWorkout.notes || ''}
        onChange={e => { store.updateWorkoutNotes(e.target.value); if (e.target.value.trim()) track(EV.NOTES_USED, { type: 'workout' }) }}
        className="w-full bg-transparent resize-none outline-none"
        style={{ color: '#ccc', caretColor: '#22c55e', fontSize: 15 }}
      />
    </div>
  )

  return (
    <>
      <div className="flex flex-col min-h-screen pb-28 pt-14">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #141414' }}>
          <div>
            {editingTitle ? (
              <input
                autoFocus
                type="text"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={() => { store.updateActiveWorkoutName(titleInput.trim() || null); setEditingTitle(false) }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { store.updateActiveWorkoutName(titleInput.trim() || null); setEditingTitle(false) }
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                className="text-white font-bold bg-transparent outline-none"
                style={{ fontSize: 18, borderBottom: '1px solid #22c55e', minWidth: 120 }}
              />
            ) : (
              <button
                onClick={() => { setTitleInput(workoutTitle || ''); setEditingTitle(true) }}
                className="flex items-center gap-2"
              >
                <div className="text-white font-bold text-lg">{workoutTitle || 'Custom Workout'}</div>
                <Pencil size={13} style={{ color: '#444' }} />
              </button>
            )}
            <div className="text-sm font-mono" style={{ color: '#22c55e' }}>{fmt(elapsed)}</div>
          </div>
          <button onClick={() => setShowFinishConfirm(true)} className="px-4 py-2.5 rounded-xl font-semibold text-sm text-black" style={{ background: '#22c55e' }}>
            Finish
          </button>
        </div>

        <div className="flex-1 px-4 pt-4">
          {/* Last same-split workouts reference (up to 3) */}
          {lastSameWorkouts.length > 0 && (
            <div className="mb-3 rounded-2xl overflow-hidden" style={{ background: '#141414' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => setShowLastSplit(s => !s)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>
                    Last {lastSameWorkouts.length > 1 ? `${lastSameWorkouts.length}x ` : ''}{SPLIT_LABELS[activeWorkout.split] || activeWorkout.split}
                  </span>
                  <span className="text-xs" style={{ color: '#444' }}>· {lastSameWorkouts[0].date}</span>
                </div>
                {showLastSplit ? <ChevronUp size={16} color="#444" /> : <ChevronDown size={16} color="#444" />}
              </button>
              {showLastSplit && (
                <div className="px-4 pb-3" style={{ borderTop: '1px solid #1e1e1e' }}>
                  {lastSameWorkouts.map((workout, wi) => (
                    <div key={workout.id}>
                      {wi > 0 && <div className="mt-3 mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#444' }}>{workout.date}</div>}
                      {workout.exercises.map(ex => {
                        const topSet = ex.sets.length > 0
                          ? ex.sets.reduce((b, s) => Number(s.weight) >= Number(b.weight) ? s : b, ex.sets[0])
                          : null
                        return (
                          <div key={ex.name} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <span className="text-white text-sm">{ex.name}</span>
                            <span className="text-xs" style={{ color: '#555' }}>
                              {ex.sets.length}s
                              {topSet?.weight ? ` · ${topSet.weight === 'BW' ? 'BW' : topSet.weight + ' lbs'}` : ''}
                              {topSet?.reps ? ` × ${topSet.reps}` : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeWorkout.exercises.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
              <Plus size={40} strokeWidth={1.5} />
              <span className="text-sm">Tap below to add your first exercise</span>
            </div>
          )}

          {/* Exercise cards */}
          {activeWorkout.exercises.map(ex => (
            <ExerciseCard
              key={ex.name}
              exercise={ex}
              expanded={expandedExercises.has(ex.name)}
              onToggleExpand={() => toggleExpanded(ex.name)}
              pr={store.getPersonalRecord(ex.name)}
              exerciseHistory={store.getExerciseHistory(ex.name)}
              onAddSet={(name, set) => { store.addSet(name, set); timerRef.current?.start(); track(EV.TIMER_TRIGGERED, { split: activeWorkout.split }) }}
              onUpdateSet={store.updateSet}
              onRemoveSet={store.removeSet}
              onToggleMoveUp={(name) => { store.toggleReadyToMoveUp(name); track(EV.MOVE_UP_TOGGLED, { name }) }}
              onUpdateNotes={(name, notes) => { store.updateExerciseNotes(name, notes); if (notes.trim()) track(EV.NOTES_USED, { type: 'exercise' }) }}
              onRemove={(name) => { store.removeExerciseFromWorkout(name); track(EV.EXERCISE_REMOVED, { name, split: activeWorkout.split }) }}
              onRename={(oldName, newName) => {
                store.renameExerciseInActiveWorkout(oldName, newName)
                setExpandedExercises(prev => {
                  const next = new Set(prev)
                  if (next.has(oldName)) { next.delete(oldName); next.add(newName) }
                  return next
                })
              }}
              onEditEquipment={store.updateExerciseEquipment}
            />
          ))}

          <button onClick={() => { setShowSelector(true); track(EV.SELECTOR_OPENED, { context: 'active_workout' }) }}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm"
            style={{ background: '#141414', color: '#22c55e', border: '1px dashed #1e1e1e' }}>
            <Plus size={18} /> Add Exercise
          </button>

          {/* Timer stays mounted in one fixed spot — moving it in/out of the exercise
              list on expand/collapse used to remount it and kill a running countdown */}
          {renderTimer()}

          {/* Workout notes always at bottom */}
          {renderWorkoutNotes()}
        </div>
      </div>

      {showSelector && (
        <ExerciseSelector
          currentExercises={activeWorkout.exercises.map(e => e.name)}
          split={activeWorkout.split}
          onSelect={(name) => {
            store.addExerciseToWorkout(name)
            setExpandedExercises(prev => new Set([...prev, name]))
            track(EV.EXERCISE_ADDED, { name, split: activeWorkout.split })
          }}
          onClose={() => setShowSelector(false)}
        />
      )}

      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#141414' }}>
            <h2 className="text-white font-bold text-lg">Finish workout?</h2>
            <p className="text-sm" style={{ color: '#888' }}>{activeWorkout.exercises.length} exercise{activeWorkout.exercises.length !== 1 ? 's' : ''} · {fmt(elapsed)}</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowFinishConfirm(false); track(EV.FINISH_CANCELLED) }} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: '#2a2a2a', color: '#888' }}>Cancel</button>
              <button onClick={handleFinish} className="flex-1 py-3 rounded-2xl font-semibold text-sm text-black" style={{ background: '#22c55e' }}>Save Workout</button>
            </div>
          </div>
        </div>
      )}

      {showSavePrompt && (
        <SaveWorkoutPrompt
          workout={activeWorkout}
          onSave={handleSaveHomeTile}
          onDismiss={() => setShowSavePrompt(false)}
        />
      )}

      {editingWorkout && (
        <WorkoutEditModal
          workout={editingWorkout}
          onSave={handleSaveEdit}
          onClose={() => setEditingWorkout(null)}
        />
      )}
    </>
  )
}
