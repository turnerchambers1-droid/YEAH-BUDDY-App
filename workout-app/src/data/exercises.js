// All muscle IDs used across the app
// Front: chest, front_delt, side_delt, biceps, forearms, abs, quads, calves
// Back:  traps, lats, mid_back, lower_back, rear_delt, triceps, glutes, hamstrings

export const MUSCLE_LABELS = {
  chest:      'Chest',
  front_delt: 'Front Delt',
  side_delt:  'Side Delt',
  rear_delt:  'Rear Delt',
  biceps:     'Biceps',
  forearms:   'Forearms',
  triceps:    'Triceps',
  traps:      'Traps',
  lats:       'Lats',
  mid_back:   'Mid Back',
  lower_back: 'Lower Back',
  abs:        'Abs',
  glutes:     'Glutes',
  hamstrings: 'Hamstrings',
  quads:      'Quads',
  calves:     'Calves',
  adductors:  'Adductors',
  abductors:  'Abductors',
}

// Each exercise: { name, displayName, equipment, unilateral, split, muscleGroup, primaryMuscles, secondaryMuscles }
// `name` is the stable lookup key against logged workout history — never rename it.
// `displayName` is the clean base name shown in the UI; equipment/unilateral (SA) render as separate badges.
export const EXERCISES = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  { name: 'Bench DB', displayName: 'Bench', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Incline Bench DB', displayName: 'Incline Bench', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Cable Fly', displayName: 'Fly', equipment: 'Cable', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'Machine Fly', displayName: 'Fly', equipment: 'Machine', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'SA Incline Press Machine', displayName: 'Incline Press', equipment: 'Machine', unilateral: true, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'DB Fly', displayName: 'Fly', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'Bench BB 8.6.4.4', displayName: 'Bench 8.6.4.4', equipment: 'Barbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Seated Cable Fly', displayName: 'Seated Fly', equipment: 'Cable', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'Incline Arnold DB', displayName: 'Incline Arnold', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['front_delt'], secondaryMuscles: ['chest','triceps'] },
  { name: 'SA Machine Chest Press', displayName: 'Chest Press', equipment: 'Machine', unilateral: true, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Incline BB Bench 8.6.4.4', displayName: 'Incline Bench 8.6.4.4', equipment: 'Barbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Push Up', displayName: 'Push Up', equipment: 'Bodyweight', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'SA Decline Press', displayName: 'Decline Press', equipment: null, unilateral: true, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Cable Press', displayName: 'Press', equipment: 'Cable', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Camber Incline Bench', displayName: 'Incline Bench', equipment: 'EZ Bar', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Smith Incline Press', displayName: 'Incline Press', equipment: 'Machine', unilateral: false, split: 'ChestBi', muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },

  // ── BICEPS ─────────────────────────────────────────────────────────────────
  { name: 'Incline Curl', displayName: 'Incline Curl', equipment: null, unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Preacher Curl EZ Bar', displayName: 'Preacher Curl', equipment: 'EZ Bar', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Hammer Curl DB', displayName: 'Hammer Curl', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Cable Hammer Curl', displayName: 'Hammer Curl', equipment: 'Cable', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'DB Preacher', displayName: 'Preacher', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Reverse DB Sitting', displayName: 'Reverse Sitting', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'EZ Reverse Preacher', displayName: 'Reverse Preacher', equipment: 'EZ Bar', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'Assisted Chin Up', displayName: 'Chin Up', equipment: 'Machine', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'DB Incline Reverse Curl', displayName: 'Incline Reverse Curl', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'DB Hammer Preacher', displayName: 'Hammer Preacher', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Reverse Cable Curl', displayName: 'Reverse Curl', equipment: 'Cable', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'EZ Bar Curl', displayName: 'Curl', equipment: 'EZ Bar', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Zottman Curl', displayName: 'Zottman Curl', equipment: null, unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Cable Curl', displayName: 'Curl', equipment: 'Cable', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Standing EZ Reverse', displayName: 'Standing Reverse', equipment: 'EZ Bar', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'Standing DB Curl', displayName: 'Standing Curl', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Machine Preacher', displayName: 'Preacher', equipment: 'Machine', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Concentration Curl', displayName: 'Concentration Curl', equipment: null, unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: [] },
  { name: 'Camber Bar Curl', displayName: 'Bar Curl', equipment: 'EZ Bar', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },

  // ── FOREARMS ───────────────────────────────────────────────────────────────
  { name: 'DB Outside Wrist Curl', displayName: 'Outside Wrist Curl', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },
  { name: 'DB Inside Wrist Curl', displayName: 'Inside Wrist Curl', equipment: 'Dumbbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },
  { name: 'BB Behind Curl', displayName: 'Behind Curl', equipment: 'Barbell', unilateral: false, split: 'ChestBi', muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },
  { name: 'Forearm Rollup', displayName: 'Forearm Rollup', equipment: null, unilateral: false, split: 'ChestBi', muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },

  // ── BACK ───────────────────────────────────────────────────────────────────
  { name: 'Wide Grip Pull Up (Assisted)', displayName: 'Wide Grip Pull Up', equipment: 'Machine', unilateral: false, split: 'BackTri', muscleGroup: 'Back',     primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Wide Grip Pull Up', displayName: 'Wide Grip Pull Up', equipment: 'Bodyweight', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Inside Grip Pull Up', displayName: 'Inside Grip Pull Up', equipment: 'Bodyweight', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Row DB', displayName: 'Row', equipment: 'Dumbbell', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps','rear_delt'] },
  { name: 'MAG Grip Pull Down', displayName: 'Pull Down', equipment: 'Cable', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Wide Grip Pull Down', displayName: 'Wide Grip Pull Down', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps'] },
  { name: 'SA Plate Pull Down', displayName: 'Plate Pull Down', equipment: 'Plate', unilateral: true, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps'] },
  { name: 'Low Machine Row', displayName: 'Low Row', equipment: 'Machine', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'SA Plate Low Row', displayName: 'Plate Low Row', equipment: 'Plate', unilateral: true, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'BB Row', displayName: 'Row', equipment: 'Barbell', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps','lower_back'] },
  { name: 'Plate Low Row', displayName: 'Plate Low Row', equipment: 'Plate', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'Cable Double SA Pull Down', displayName: 'Double Pull Down', equipment: 'Cable', unilateral: true, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps'] },
  { name: 'Wide Machine Bent Row', displayName: 'Wide Bent Row', equipment: 'Machine', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','rear_delt'] },
  { name: 'Narrow Machine Bent Row', displayName: 'Narrow Bent Row', equipment: 'Machine', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'Lat Pushdown', displayName: 'Lat Pushdown', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: [] },
  { name: 'SA Cable Low Row', displayName: 'Low Row', equipment: 'Cable', unilateral: true, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'DA Cable Low Row', displayName: 'DA Low Row', equipment: 'Cable', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'T Bar Row', displayName: 'T Bar Row', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps','lower_back'] },
  { name: 'Kneeling SA Cable Row', displayName: 'Kneeling Row', equipment: 'Cable', unilateral: true, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'SA Seated Plate Row', displayName: 'Seated Plate Row', equipment: 'Plate', unilateral: true, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'Rope Lat Pushdown', displayName: 'Lat Pushdown', equipment: 'Cable', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: [] },
  { name: 'MAG Cable Low Row', displayName: 'MAG Low Row', equipment: 'Cable', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },

  // ── TRICEPS ────────────────────────────────────────────────────────────────
  { name: 'French Press', displayName: 'French Press', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Kickback DB', displayName: 'Kickback', equipment: 'Dumbbell', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Dips', displayName: 'Dips', equipment: 'Bodyweight', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: ['chest','front_delt'] },
  { name: 'Tricep Pushdown', displayName: 'Tricep Pushdown', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'EZ Skull Crushers', displayName: 'Skull Crushers', equipment: 'EZ Bar', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Rope Tricep Extension', displayName: 'Tricep Extension', equipment: 'Cable', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Curl Bar Pushdown', displayName: 'Pushdown', equipment: 'EZ Bar', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Machine Tricep Press', displayName: 'Tricep Press', equipment: 'Machine', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'SA No Attachment Pushdown', displayName: 'No Attachment Pushdown', equipment: null, unilateral: true, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Cable SA Extension', displayName: 'Extension', equipment: 'Cable', unilateral: true, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Straight Bar Pushdown', displayName: 'Straight Bar Pushdown', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Bent Over Pushdown', displayName: 'Bent Over Pushdown', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'DB Ext Superset', displayName: 'Ext Superset', equipment: 'Dumbbell', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'SA French Press', displayName: 'French Press', equipment: null, unilateral: true, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Machine Tricep Extension', displayName: 'Tricep Extension', equipment: 'Machine', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Close Grip Bench', displayName: 'Close Grip Bench', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: ['chest','front_delt'] },
  { name: 'Cable Kickback', displayName: 'Kickback', equipment: 'Cable', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },

  // ── TRAPS ──────────────────────────────────────────────────────────────────
  { name: 'Shrug DB', displayName: 'Shrug', equipment: 'Dumbbell', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Face Pull', displayName: 'Face Pull', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['rear_delt'],  secondaryMuscles: ['traps','mid_back'] },
  { name: 'Shrug Hex Bar', displayName: 'Shrug', equipment: 'Barbell', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Shrug Machine', displayName: 'Shrug', equipment: 'Machine', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Shrug BB', displayName: 'Shrug', equipment: 'Barbell', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Upright BB Row', displayName: 'Upright Row', equipment: 'Barbell', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: ['side_delt','biceps'] },
  { name: 'Upright DB Row', displayName: 'Upright Row', equipment: 'Dumbbell', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: ['side_delt','biceps'] },
  { name: 'Hang Clean', displayName: 'Hang Clean', equipment: null, unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: ['glutes','lower_back','quads'] },
  { name: 'Prone DB Press', displayName: 'Prone Press', equipment: 'Dumbbell', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['rear_delt'],  secondaryMuscles: ['traps','mid_back'] },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  { name: 'Shoulder Press DB', displayName: 'Shoulder Press', equipment: 'Dumbbell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Lat Raise DB', displayName: 'Lat Raise', equipment: 'Dumbbell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: ['traps'] },
  { name: 'Lat Raise Cable', displayName: 'Lat Raise', equipment: 'Cable', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: ['traps'] },
  { name: 'Plate Shoulder Press', displayName: 'Plate Shoulder Press', equipment: 'Plate', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'Arnold Press', displayName: 'Arnold Press', equipment: null, unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'Interior Rotation', displayName: 'Interior Rotation', equipment: null, unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: [] },
  { name: 'Standing BB Press', displayName: 'Standing Press', equipment: 'Barbell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'Seated BB Press', displayName: 'Seated Press', equipment: 'Barbell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'DB Front Raise', displayName: 'Front Raise', equipment: 'Dumbbell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: [] },
  { name: 'Seated DB Lat Raise', displayName: 'Seated Lat Raise', equipment: 'Dumbbell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: [] },
  { name: 'Cuban Press', displayName: 'Cuban Press', equipment: null, unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['rear_delt'],  secondaryMuscles: ['traps','side_delt'] },
  { name: 'Front Raise EZ Bar', displayName: 'Front Raise', equipment: 'EZ Bar', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: [] },
  { name: 'Machine Lateral Raise', displayName: 'Lateral Raise', equipment: 'Machine', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: [] },

  // ── REAR DELT ──────────────────────────────────────────────────────────────
  { name: 'Rear Delt Machine', displayName: 'Rear Delt', equipment: 'Machine', unilateral: false, split: 'Shoulders', muscleGroup: 'Rear Delt', primaryMuscles: ['rear_delt'],  secondaryMuscles: ['mid_back'] },
  { name: 'Cable Rear Delt', displayName: 'Rear Delt', equipment: 'Cable', unilateral: false, split: 'Shoulders', muscleGroup: 'Rear Delt', primaryMuscles: ['rear_delt'],  secondaryMuscles: ['mid_back'] },
  { name: 'DB Rear Delt', displayName: 'Rear Delt', equipment: 'Dumbbell', unilateral: false, split: 'Shoulders', muscleGroup: 'Rear Delt', primaryMuscles: ['rear_delt'],  secondaryMuscles: ['mid_back','traps'] },

  // ── HAMSTRINGS ─────────────────────────────────────────────────────────────
  { name: 'Prone Leg Curl', displayName: 'Prone Leg Curl', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },
  { name: 'Back Squat', displayName: 'Back Squat', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['hamstrings','glutes','lower_back'] },
  { name: 'Leg Curl', displayName: 'Leg Curl', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },
  { name: 'Goblet Squat', displayName: 'Goblet Squat', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Lateral Leg Press Machine', displayName: 'Lateral Leg Press', equipment: 'Machine', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Reverse Leg Press', displayName: 'Reverse Leg Press', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Glute Back Extension', displayName: 'Glute Back Extension', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['glutes'],     secondaryMuscles: ['hamstrings','lower_back'] },
  { name: 'DB Bulgarian Split Squat', displayName: 'Bulgarian Split Squat', equipment: 'Dumbbell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'BB Bulgarian Split Squat', displayName: 'Bulgarian Split Squat', equipment: 'Barbell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'DB RDL', displayName: 'RDL', equipment: 'Dumbbell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes','lower_back'] },
  { name: 'BB Deadlift', displayName: 'Deadlift', equipment: 'Barbell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes','lower_back','quads'] },
  { name: 'HB Deadlift', displayName: 'Deadlift', equipment: 'Barbell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes','lower_back','quads'] },
  { name: 'Smith Back Lunge', displayName: 'Back Lunge', equipment: 'Machine', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'SL Kneeling Curl', displayName: 'SL Kneeling Curl', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },

  // ── QUADS ──────────────────────────────────────────────────────────────────
  { name: 'Back Squat 8.6.4.4', displayName: 'Back Squat 8.6.4.4', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['hamstrings','glutes','lower_back'] },
  { name: 'Leg Press', displayName: 'Leg Press', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Leg Extension', displayName: 'Leg Extension', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: [] },
  { name: 'Reverse Lunge Slides Front', displayName: 'Reverse Lunge Slides Front', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Reverse Lunge Back', displayName: 'Reverse Lunge Back', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Single Leg Press Machine', displayName: 'Single Leg Press', equipment: 'Machine', unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Hack Squat', displayName: 'Hack Squat', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes'] },
  { name: 'Front Squat', displayName: 'Front Squat', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','lower_back'] },
  { name: 'Belt Squat', displayName: 'Belt Squat', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes'] },

  // ── GLUTES ─────────────────────────────────────────────────────────────────
  { name: 'Glute Machine Extension', displayName: 'Glute Extension', equipment: 'Machine', unilateral: false, split: 'LegsAbs', muscleGroup: 'Glute',     primaryMuscles: ['glutes'],     secondaryMuscles: ['hamstrings'] },

  // ── CALVES ─────────────────────────────────────────────────────────────────
  { name: 'Seated Calf Raise', displayName: 'Seated Calf Raise', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },
  { name: 'Standing Calf Raise', displayName: 'Standing Calf Raise', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },
  { name: 'Press Calf Extension', displayName: 'Press Calf Extension', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },
  { name: 'Smith Calf Raise', displayName: 'Calf Raise', equipment: 'Machine', unilateral: false, split: 'LegsAbs', muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },

  // ── ABS / ADDUCTORS ────────────────────────────────────────────────────────
  { name: 'Abduction (Outward)', displayName: 'Abduction (Outward)', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',         primaryMuscles: ['abductors'],             secondaryMuscles: ['glutes'] },
  { name: 'Adduction (Inward)', displayName: 'Adduction (Inward)', equipment: null, unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',         primaryMuscles: ['adductors'],             secondaryMuscles: [] },
  { name: 'Bench Crunch', displayName: 'Bench Crunch', equipment: 'Bodyweight', unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',         primaryMuscles: ['abs'],                   secondaryMuscles: [] },
  { name: 'Leg Raise', displayName: 'Leg Raise', equipment: 'Bodyweight', unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',         primaryMuscles: ['abs'],                   secondaryMuscles: [] },
  { name: 'Cable Crunch', displayName: 'Crunch', equipment: 'Cable', unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',         primaryMuscles: ['abs'],                   secondaryMuscles: [] },

  // ── KETTLEBELL ─────────────────────────────────────────────────────────────
  { name: 'KB Swing', displayName: 'Swing', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['glutes','hamstrings'],    secondaryMuscles: ['lower_back','traps'] },
  { name: 'KB Turkish Get Up', displayName: 'Turkish Get Up', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',       primaryMuscles: ['front_delt','abs'],       secondaryMuscles: ['glutes','triceps'] },
  { name: 'KB Clean', displayName: 'Clean', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['glutes','hamstrings'],    secondaryMuscles: ['traps','biceps','lower_back'] },
  { name: 'KB Snatch', displayName: 'Snatch', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['glutes','hamstrings'],    secondaryMuscles: ['traps','front_delt','lower_back'] },
  { name: 'KB Clean & Press', displayName: 'Clean & Press', equipment: 'Kettlebell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['glutes','front_delt'],    secondaryMuscles: ['traps','triceps','lower_back'] },
  { name: 'KB Goblet Squat', displayName: 'Goblet Squat', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],                 secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'KB Deadlift', displayName: 'Deadlift', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings','glutes'],    secondaryMuscles: ['lower_back','traps'] },
  { name: 'KB Front Squat', displayName: 'Front Squat', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],                 secondaryMuscles: ['glutes','front_delt'] },
  { name: 'KB Lunge', displayName: 'Lunge', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Quad',      primaryMuscles: ['quads'],                 secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'KB RDL', displayName: 'RDL', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'],            secondaryMuscles: ['glutes','lower_back'] },
  { name: 'KB Press', displayName: 'Press', equipment: 'Kettlebell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'],            secondaryMuscles: ['side_delt','triceps'] },
  { name: 'KB Push Press', displayName: 'Push Press', equipment: 'Kettlebell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'],            secondaryMuscles: ['side_delt','triceps','quads'] },
  { name: 'KB Halo', displayName: 'Halo', equipment: 'Kettlebell', unilateral: false, split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],             secondaryMuscles: ['front_delt','traps'] },
  { name: 'KB Windmill', displayName: 'Windmill', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',       primaryMuscles: ['front_delt'],            secondaryMuscles: ['abs','side_delt','glutes'] },
  { name: 'KB Row', displayName: 'Row', equipment: 'Kettlebell', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['mid_back'],              secondaryMuscles: ['lats','biceps','rear_delt'] },
  { name: 'KB Lat Pullover', displayName: 'Lat Pullover', equipment: 'Kettlebell', unilateral: false, split: 'BackTri', muscleGroup: 'Back',      primaryMuscles: ['lats'],                  secondaryMuscles: ['chest'] },
  { name: 'KB Crush Curl', displayName: 'Crush Curl', equipment: 'Kettlebell', unilateral: false, split: 'ChestBi', muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],                secondaryMuscles: ['forearms'] },
  { name: 'KB Tricep Kickback', displayName: 'Tricep Kickback', equipment: 'Kettlebell', unilateral: false, split: 'BackTri', muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],               secondaryMuscles: [] },
  { name: 'KB Farmer Carry', displayName: 'Farmer Carry', equipment: 'Kettlebell', unilateral: false, split: 'BackTri', muscleGroup: 'Trap',      primaryMuscles: ['traps','forearms'],       secondaryMuscles: ['glutes','abs'] },
  { name: 'KB Around the World', displayName: 'Around the World', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',       primaryMuscles: ['abs'],                   secondaryMuscles: ['side_delt','front_delt'] },
  { name: 'KB Figure Eight', displayName: 'Figure Eight', equipment: 'Kettlebell', unilateral: false, split: 'LegsAbs', muscleGroup: 'Abs',       primaryMuscles: ['abs'],                   secondaryMuscles: ['quads','glutes'] },
]

export const SPLITS = ['ChestBi', 'BackTri', 'Shoulders', 'LegsAbs']

export const SPLIT_LABELS = {
  ChestBi:    'Chest & Bi',
  BackTri:    'Back & Tri',
  Shoulders:  'Shoulders',
  LegsAbs:    'Legs & Abs',
}

// Infer equipment type from an exercise object or name string.
// Custom exercises already carry an `equipment` field — use that when present.
export function inferEquipment(ex) {
  if (ex && typeof ex === 'object' && ex.equipment) {
    const e = ex.equipment.toLowerCase()
    if (e === 'barbell')    return 'BB'
    if (e === 'dumbbell')   return 'DB'
    if (e === 'kettlebell') return 'KB'
    if (e === 'cable')      return 'Cable'
    if (e === 'machine')    return 'Machine'
    if (e === 'bodyweight') return 'BW'
    return ex.equipment
  }
  const n = (typeof ex === 'string' ? ex : ex?.name ?? '').toLowerCase()

  if (n.startsWith('kb ') || n.includes(' kb '))              return 'KB'
  if (/\bbb\b/.test(n))                                        return 'BB'
  if (/\bdb\b/.test(n))                                        return 'DB'
  if (/\bez\b/.test(n) || n.includes('camber') || n.includes('curl bar')) return 'EZ'
  if (n.includes('hex bar') || /\bhb\b/.test(n))               return 'BB'
  if (n.includes('cable') || n.includes('mag grip') || n.includes('rope ')) return 'Cable'
  if (n.includes('machine') || n.includes('smith'))            return 'Machine'
  if (n.includes('assisted'))                                  return 'Machine'
  if (n.includes('plate') && !n.includes('shoulder'))          return 'Plate'
  if (n.includes('pushdown') || n.includes('pull down'))       return 'Cable'
  if (n.includes('dips') || n.includes('push up') || n.includes('pull up') || n.includes('chin up')) return 'BW'
  if (n.includes('face pull'))                                 return 'Cable'
  if (n.includes('back squat') || n.includes('front squat') || n.includes('t bar') || n.includes('hang clean')) return 'BB'
  if (n.includes('hack squat') || n.includes('belt squat'))   return 'Machine'
  if (n.includes('leg press') || n.includes('leg curl') || n.includes('leg extension')) return 'Machine'
  if (n.includes('calf raise'))                               return 'Machine'
  if (n.includes('abduction') || n.includes('adduction'))     return 'Machine'
  if (n.includes('prone leg') || n.includes('glute back'))    return 'Machine'
  if (n.includes('lat push') || n.includes('row') && n.includes('cable')) return 'Cable'

  return null
}

// Equipment color palette
export const EQUIP_COLORS = {
  BB:      { bg: '#f59e0b22', text: '#f59e0b', border: '#f59e0b55' },
  DB:      { bg: '#3b82f622', text: '#3b82f6', border: '#3b82f655' },
  KB:      { bg: '#a78bfa22', text: '#a78bfa', border: '#a78bfa55' },
  Cable:   { bg: '#f9731622', text: '#f97316', border: '#f9731655' },
  Machine: { bg: '#22d3ee22', text: '#22d3ee', border: '#22d3ee55' },
  BW:      { bg: '#22c55e22', text: '#22c55e', border: '#22c55e55' },
  EZ:      { bg: '#f43f5e22', text: '#f43f5e', border: '#f43f5e55' },
  Plate:   { bg: '#84cc1622', text: '#84cc16', border: '#84cc1655' },
}

export function getExerciseByName(name) {
  return EXERCISES.find(e => e.name === name)
}

// Look up display metadata (displayName/equipment/unilateral) for a logged
// exercise name, checking the built-in catalog then a user's custom exercises.
// Falls back to the raw name when no catalog entry exists.
export function getExerciseMeta(name, customExercises = []) {
  const ex = EXERCISES.find(e => e.name === name) || customExercises.find(e => e.name === name)
  if (!ex) return { name, displayName: name, equipment: null, unilateral: false }
  return ex
}

export function getExercisesBySplit(split) {
  return EXERCISES.filter(e => e.split === split)
}

export function getExercisesByMuscle(muscle) {
  return EXERCISES.filter(e =>
    e.primaryMuscles.includes(muscle) || e.secondaryMuscles.includes(muscle)
  )
}
