import { getExerciseMeta, inferEquipment, EQUIP_COLORS } from '../data/exercises'
import { useWorkoutStore } from '../store/workoutStore'

export function EquipBadge({ eq, small = false }) {
  const c = EQUIP_COLORS[eq]
  if (!c) return null
  return (
    <span
      className="flex-shrink-0 font-bold rounded"
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        fontSize: small ? 9 : 10,
        padding: small ? '1px 5px' : '2px 6px',
        letterSpacing: '0.03em',
      }}
    >
      {eq}
    </span>
  )
}

export function SABadge({ small = false }) {
  return (
    <span
      className="flex-shrink-0 font-bold rounded"
      style={{
        background: '#eab30822',
        color: '#eab308',
        border: '1px solid #eab30855',
        fontSize: small ? 9 : 10,
        padding: small ? '1px 5px' : '2px 6px',
        letterSpacing: '0.03em',
      }}
    >
      SA
    </span>
  )
}

// Renders an exercise's clean base name plus equipment/single-arm badges.
// `name` is the stable logged-exercise name (lookup key); never the display text itself.
export default function ExerciseLabel({ name, small = false, textClassName = '', textStyle = {} }) {
  const store = useWorkoutStore()
  const meta = getExerciseMeta(name, store.customExercises)
  const eq = inferEquipment(meta)

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={textClassName} style={textStyle}>{meta.displayName || meta.name}</span>
      {eq && <EquipBadge eq={eq} small={small} />}
      {meta.unilateral && <SABadge small={small} />}
    </span>
  )
}
