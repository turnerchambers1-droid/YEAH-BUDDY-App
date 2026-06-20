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

// Each exercise: { name, split, muscleGroup, primaryMuscles, secondaryMuscles }
export const EXERCISES = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  { name: 'Bench DB',                   split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Incline Bench DB',           split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Cable Fly',                  split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'Machine Fly',                split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'SA Incline Press Machine',   split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'DB Fly',                     split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'Bench BB 8.6.4.4',           split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Seated Cable Fly',           split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt'] },
  { name: 'Incline Arnold DB',          split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['front_delt'], secondaryMuscles: ['chest','triceps'] },
  { name: 'SA Machine Chest Press',     split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Incline BB Bench 8.6.4.4',   split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Push Up',                    split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'SA Decline Press',           split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Cable Press',                split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Camber Incline Bench',       split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Smith Incline Press',        split: 'ChestBi',   muscleGroup: 'Chest',     primaryMuscles: ['chest'],      secondaryMuscles: ['front_delt','triceps'] },

  // ── BICEPS ─────────────────────────────────────────────────────────────────
  { name: 'Incline Curl',               split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Preacher Curl EZ Bar',       split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Hammer Curl DB',             split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Cable Hammer Curl',          split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'DB Preacher',                split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Reverse DB Sitting',         split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'EZ Reverse Preacher',        split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'Assisted Chin Up',           split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'DB Incline Reverse Curl',    split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'DB Hammer Preacher',         split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Reverse Cable Curl',         split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'EZ Bar Curl',                split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Zottman Curl',               split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Cable Curl',                 split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Standing EZ Reverse',        split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['forearms'],   secondaryMuscles: ['biceps'] },
  { name: 'Standing DB Curl',           split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Machine Preacher',           split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },
  { name: 'Concentration Curl',         split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: [] },
  { name: 'Camber Bar Curl',            split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],     secondaryMuscles: ['forearms'] },

  // ── FOREARMS ───────────────────────────────────────────────────────────────
  { name: 'DB Outside Wrist Curl',      split: 'ChestBi',   muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },
  { name: 'DB Inside Wrist Curl',       split: 'ChestBi',   muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },
  { name: 'BB Behind Curl',             split: 'ChestBi',   muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },
  { name: 'Forearm Rollup',             split: 'ChestBi',   muscleGroup: 'Forearm',   primaryMuscles: ['forearms'],   secondaryMuscles: [] },

  // ── BACK ───────────────────────────────────────────────────────────────────
  { name: 'Wide Grip Pull Up (Assisted)',  split: 'BackTri', muscleGroup: 'Back',     primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Wide Grip Pull Up',          split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Inside Grip Pull Up',        split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Row DB',                     split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps','rear_delt'] },
  { name: 'MAG Grip Pull Down',         split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps','mid_back'] },
  { name: 'Wide Grip Pull Down',        split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps'] },
  { name: 'SA Plate Pull Down',         split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps'] },
  { name: 'Low Machine Row',            split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'SA Plate Low Row',           split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'BB Row',                     split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps','lower_back'] },
  { name: 'Plate Low Row',              split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'Cable Double SA Pull Down',  split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: ['biceps'] },
  { name: 'Wide Machine Bent Row',      split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','rear_delt'] },
  { name: 'Narrow Machine Bent Row',    split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'Lat Pushdown',               split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: [] },
  { name: 'SA Cable Low Row',           split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'DA Cable Low Row',           split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'T Bar Row',                  split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps','lower_back'] },
  { name: 'Kneeling SA Cable Row',      split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'SA Seated Plate Row',        split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },
  { name: 'Rope Lat Pushdown',          split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],       secondaryMuscles: [] },
  { name: 'MAG Cable Low Row',          split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],   secondaryMuscles: ['lats','biceps'] },

  // ── TRICEPS ────────────────────────────────────────────────────────────────
  { name: 'French Press',               split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Kickback DB',                split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Dips',                       split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: ['chest','front_delt'] },
  { name: 'Tricep Pushdown',            split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'EZ Skull Crushers',          split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Rope Tricep Extension',      split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Curl Bar Pushdown',          split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Machine Tricep Press',       split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'SA No Attachment Pushdown',  split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Cable SA Extension',         split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Straight Bar Pushdown',      split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Bent Over Pushdown',         split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'DB Ext Superset',            split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'SA French Press',            split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Machine Tricep Extension',   split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },
  { name: 'Close Grip Bench',           split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: ['chest','front_delt'] },
  { name: 'Cable Kickback',             split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],    secondaryMuscles: [] },

  // ── TRAPS ──────────────────────────────────────────────────────────────────
  { name: 'Shrug DB',                   split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Face Pull',                  split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['rear_delt'],  secondaryMuscles: ['traps','mid_back'] },
  { name: 'Shrug Hex Bar',              split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Shrug Machine',              split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Shrug BB',                   split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: [] },
  { name: 'Upright BB Row',             split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: ['side_delt','biceps'] },
  { name: 'Upright DB Row',             split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: ['side_delt','biceps'] },
  { name: 'Hang Clean',                 split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps'],      secondaryMuscles: ['glutes','lower_back','quads'] },
  { name: 'Prone DB Press',             split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['rear_delt'],  secondaryMuscles: ['traps','mid_back'] },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  { name: 'Shoulder Press DB',          split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: ['front_delt','triceps'] },
  { name: 'Lat Raise DB',               split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: ['traps'] },
  { name: 'Lat Raise Cable',            split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: ['traps'] },
  { name: 'Plate Shoulder Press',       split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'Arnold Press',               split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'Interior Rotation',          split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: [] },
  { name: 'Standing BB Press',          split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'Seated BB Press',            split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: ['side_delt','triceps'] },
  { name: 'DB Front Raise',             split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: [] },
  { name: 'Seated DB Lat Raise',        split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: [] },
  { name: 'Cuban Press',                split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['rear_delt'],  secondaryMuscles: ['traps','side_delt'] },
  { name: 'Front Raise EZ Bar',         split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'], secondaryMuscles: [] },
  { name: 'Machine Lateral Raise',      split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],  secondaryMuscles: [] },

  // ── REAR DELT ──────────────────────────────────────────────────────────────
  { name: 'Rear Delt Machine',          split: 'Shoulders', muscleGroup: 'Rear Delt', primaryMuscles: ['rear_delt'],  secondaryMuscles: ['mid_back'] },
  { name: 'Cable Rear Delt',            split: 'Shoulders', muscleGroup: 'Rear Delt', primaryMuscles: ['rear_delt'],  secondaryMuscles: ['mid_back'] },
  { name: 'DB Rear Delt',               split: 'Shoulders', muscleGroup: 'Rear Delt', primaryMuscles: ['rear_delt'],  secondaryMuscles: ['mid_back','traps'] },

  // ── HAMSTRINGS ─────────────────────────────────────────────────────────────
  { name: 'Prone Leg Curl',             split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },
  { name: 'Back Squat',                 split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['hamstrings','glutes','lower_back'] },
  { name: 'Leg Curl',                   split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },
  { name: 'Goblet Squat',               split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Lateral Leg Press Machine',  split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Reverse Leg Press',          split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Glute Back Extension',       split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['glutes'],     secondaryMuscles: ['hamstrings','lower_back'] },
  { name: 'DB Bulgarian Split Squat',   split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'BB Bulgarian Split Squat',   split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'DB RDL',                     split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes','lower_back'] },
  { name: 'BB Deadlift',                split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes','lower_back','quads'] },
  { name: 'HB Deadlift',                split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes','lower_back','quads'] },
  { name: 'Smith Back Lunge',           split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'SL Kneeling Curl',           split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },

  // ── QUADS ──────────────────────────────────────────────────────────────────
  { name: 'Back Squat 8.6.4.4',         split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['hamstrings','glutes','lower_back'] },
  { name: 'Leg Press',                  split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Leg Extension',              split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: [] },
  { name: 'Reverse Lunge Slides Front', split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Reverse Lunge Back',         split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Single Leg Press Machine',   split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'Hack Squat',                 split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes'] },
  { name: 'Front Squat',                split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes','lower_back'] },
  { name: 'Belt Squat',                 split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],      secondaryMuscles: ['glutes'] },

  // ── GLUTES ─────────────────────────────────────────────────────────────────
  { name: 'Glute Machine Extension',    split: 'LegsAbs',   muscleGroup: 'Glute',     primaryMuscles: ['glutes'],     secondaryMuscles: ['hamstrings'] },

  // ── CALVES ─────────────────────────────────────────────────────────────────
  { name: 'Seated Calf Raise',          split: 'LegsAbs',   muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },
  { name: 'Standing Calf Raise',        split: 'LegsAbs',   muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },
  { name: 'Press Calf Extension',       split: 'LegsAbs',   muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },
  { name: 'Smith Calf Raise',           split: 'LegsAbs',   muscleGroup: 'Calf',      primaryMuscles: ['calves'],     secondaryMuscles: [] },

  // ── ABS / ADDUCTORS ────────────────────────────────────────────────────────
  { name: 'Abduction (Outward)',         split: 'LegsAbs',    muscleGroup: 'Abs',         primaryMuscles: ['abductors'],             secondaryMuscles: ['glutes'] },
  { name: 'Adduction (Inward)',          split: 'LegsAbs',    muscleGroup: 'Abs',         primaryMuscles: ['adductors'],             secondaryMuscles: [] },
  { name: 'Bench Crunch',               split: 'LegsAbs',    muscleGroup: 'Abs',         primaryMuscles: ['abs'],                   secondaryMuscles: [] },
  { name: 'Leg Raise',                  split: 'LegsAbs',    muscleGroup: 'Abs',         primaryMuscles: ['abs'],                   secondaryMuscles: [] },
  { name: 'Cable Crunch',               split: 'LegsAbs',    muscleGroup: 'Abs',         primaryMuscles: ['abs'],                   secondaryMuscles: [] },

  // ── KETTLEBELL (KB = equipment descriptor, distributed by real muscle group) ───────
  { name: 'KB Swing',            split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['glutes','hamstrings'],    secondaryMuscles: ['lower_back','traps'] },
  { name: 'KB Turkish Get Up',   split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt','abs'],       secondaryMuscles: ['glutes','triceps'] },
  { name: 'KB Clean',            split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['glutes','hamstrings'],    secondaryMuscles: ['traps','biceps','lower_back'] },
  { name: 'KB Snatch',           split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['glutes','hamstrings'],    secondaryMuscles: ['traps','front_delt','lower_back'] },
  { name: 'KB Clean & Press',    split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['glutes','front_delt'],    secondaryMuscles: ['traps','triceps','lower_back'] },
  { name: 'KB Goblet Squat',     split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],                 secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'KB Deadlift',         split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings','glutes'],    secondaryMuscles: ['lower_back','traps'] },
  { name: 'KB Front Squat',      split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],                 secondaryMuscles: ['glutes','front_delt'] },
  { name: 'KB Lunge',            split: 'LegsAbs',   muscleGroup: 'Quad',      primaryMuscles: ['quads'],                 secondaryMuscles: ['glutes','hamstrings'] },
  { name: 'KB RDL',              split: 'LegsAbs',   muscleGroup: 'Hamstring', primaryMuscles: ['hamstrings'],            secondaryMuscles: ['glutes','lower_back'] },
  { name: 'KB Press',            split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'],            secondaryMuscles: ['side_delt','triceps'] },
  { name: 'KB Push Press',       split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'],            secondaryMuscles: ['side_delt','triceps','quads'] },
  { name: 'KB Halo',             split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['side_delt'],             secondaryMuscles: ['front_delt','traps'] },
  { name: 'KB Windmill',         split: 'Shoulders', muscleGroup: 'Shoulder',  primaryMuscles: ['front_delt'],            secondaryMuscles: ['abs','side_delt','glutes'] },
  { name: 'KB Row',              split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['mid_back'],              secondaryMuscles: ['lats','biceps','rear_delt'] },
  { name: 'KB Lat Pullover',     split: 'BackTri',   muscleGroup: 'Back',      primaryMuscles: ['lats'],                  secondaryMuscles: ['chest'] },
  { name: 'KB Crush Curl',       split: 'ChestBi',   muscleGroup: 'Bicep',     primaryMuscles: ['biceps'],                secondaryMuscles: ['forearms'] },
  { name: 'KB Tricep Kickback',  split: 'BackTri',   muscleGroup: 'Tricep',    primaryMuscles: ['triceps'],               secondaryMuscles: [] },
  { name: 'KB Farmer Carry',     split: 'BackTri',   muscleGroup: 'Trap',      primaryMuscles: ['traps','forearms'],       secondaryMuscles: ['glutes','abs'] },
  { name: 'KB Around the World', split: 'LegsAbs',   muscleGroup: 'Abs',       primaryMuscles: ['abs'],                   secondaryMuscles: ['side_delt','front_delt'] },
  { name: 'KB Figure Eight',     split: 'LegsAbs',   muscleGroup: 'Abs',       primaryMuscles: ['abs'],                   secondaryMuscles: ['quads','glutes'] },
]

export const SPLITS = ['ChestBi', 'BackTri', 'Shoulders', 'LegsAbs']

export const SPLIT_LABELS = {
  ChestBi:   'Chest & Bi',
  BackTri:   'Back & Tri',
  Shoulders: 'Shoulders',
  LegsAbs:   'Legs & Abs',
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

// Split an exercise name into a readable base name + descriptor tags for display.
// Data keys are unchanged; this is for UI rendering only.
export function parseExerciseDisplay(name) {
  const LEAD = ['KB', 'SA', 'DA', 'SL', 'HB', 'DB', 'BB', 'EZ', 'MAG', 'Cable']
  const TRAIL = ['DB', 'BB', 'EZ', 'Machine', 'Cable']
  let words = name.trim().split(/\s+/)
  const tags = []
  while (words.length > 1 && LEAD.includes(words[0])) tags.push(words.shift())
  while (words.length > 1 && TRAIL.includes(words[words.length - 1])) tags.push(words.pop())
  return { displayName: words.join(' '), tags: [...new Set(tags)] }
}

export function getExerciseByName(name) {
  return EXERCISES.find(e => e.name === name)
}

export function getExercisesBySplit(split) {
  return EXERCISES.filter(e => e.split === split)
}

export function getExercisesByMuscle(muscle) {
  return EXERCISES.filter(e =>
    e.primaryMuscles.includes(muscle) || e.secondaryMuscles.includes(muscle)
  )
}
