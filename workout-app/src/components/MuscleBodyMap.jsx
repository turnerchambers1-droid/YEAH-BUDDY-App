// Organic human-like SVG muscle body map — front and back views

const ACCENT   = '#00d4ff'
const SECONDARY = '#22c55e'
const BASE     = '#252525'
const SKIN     = '#1c1c1c'
const OUTLINE  = '#383838'

// Which muscles appear on each view
const FRONT_IDS = new Set(['chest','front_delt','side_delt','biceps','forearms','abs','quads','calves','adductors','abductors'])
const BACK_IDS  = new Set(['traps','lats','mid_back','lower_back','rear_delt','triceps','glutes','hamstrings','calves'])

function c(id, primary, secondary) {
  if (primary.includes(id))   return ACCENT
  if (secondary.includes(id)) return SECONDARY
  return BASE
}

// Shared body silhouette paths (same shape front & back)
function BodySilhouette() {
  return (
    <g fill={SKIN} stroke={OUTLINE} strokeWidth="1.2">
      {/* Head */}
      <path d="M100,8 C115,8 122,15 122,30 C122,45 115,56 100,58 C85,58 78,45 78,30 C78,15 85,8 100,8 Z" />
      {/* Neck */}
      <path d="M91,55 C90,58 89,65 90,73 L110,73 C111,65 110,58 109,55 Z" />
      {/* Torso — organic with chest flare, waist taper, hip flare */}
      <path d="
        M90,73
        C82,75 64,79 48,88
        C36,96 32,112 32,132
        C32,152 36,168 42,183
        C45,193 47,203 48,212
        L152,212
        C153,203 155,193 158,183
        C164,168 168,152 168,132
        C168,112 164,96 152,88
        C136,79 118,75 110,73
        Z" />
      {/* Left upper arm */}
      <path d="M48,88 C42,93 30,112 26,142 C24,156 26,167 28,172 L44,165 C42,155 40,142 42,120 C44,105 50,95 58,87 Z" />
      {/* Right upper arm */}
      <path d="M152,88 C158,93 170,112 174,142 C176,156 174,167 172,172 L156,165 C158,155 160,142 158,120 C156,105 150,95 142,87 Z" />
      {/* Left forearm */}
      <path d="M28,172 C22,190 22,212 24,232 L40,234 C40,214 40,192 44,174 Z" />
      {/* Right forearm */}
      <path d="M172,172 C178,190 178,212 176,232 L160,234 C160,214 160,192 156,174 Z" />
      {/* Hands */}
      <path d="M24,232 C20,240 22,250 32,252 C42,254 44,246 40,236 Z" />
      <path d="M176,232 C180,240 178,250 168,252 C158,254 156,246 160,236 Z" />
      {/* Hips */}
      <path d="M48,212 C44,222 42,234 44,244 L156,244 C158,234 156,222 152,212 Z" />
      {/* Left thigh */}
      <path d="M44,244 C38,268 36,296 38,318 L68,318 C66,296 64,268 60,244 Z" />
      {/* Right thigh */}
      <path d="M156,244 C162,268 164,296 162,318 L132,318 C136,296 140,268 140,244 Z" />
      {/* Left lower leg */}
      <path d="M38,320 C34,346 36,374 40,396 L66,396 C68,374 68,346 66,320 Z" />
      {/* Right lower leg */}
      <path d="M162,320 C166,346 164,374 160,396 L134,396 C130,374 130,346 132,320 Z" />
      {/* Feet */}
      <path d="M40,396 C34,402 32,412 50,415 C64,416 68,408 66,396 Z" />
      <path d="M160,396 C166,402 168,412 150,415 C136,416 132,408 134,396 Z" />
    </g>
  )
}

function FrontView({ pm = [], sm = [], onClick }) {
  const col = id => c(id, pm, sm)
  return (
    <svg viewBox="0 0 200 425" style={{ width: '100%', maxHeight: 390 }}>
      <BodySilhouette />

      {/* ── MUSCLE OVERLAYS ── */}
      {/* Front delts */}
      <path d="M48,82 C40,87 37,98 40,110 C43,120 51,124 58,120 C65,116 66,106 63,95 C60,85 53,79 48,82 Z"
        fill={col('front_delt')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('front_delt')} />
      <path d="M152,82 C160,87 163,98 160,110 C157,120 149,124 142,120 C135,116 134,106 137,95 C140,85 147,79 152,82 Z"
        fill={col('front_delt')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('front_delt')} />

      {/* Side delts */}
      <path d="M36,84 C29,89 27,101 31,112 C34,120 41,122 46,117 C51,112 51,100 47,91 C44,84 38,82 36,84 Z"
        fill={col('side_delt')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('side_delt')} />
      <path d="M164,84 C171,89 173,101 169,112 C166,120 159,122 154,117 C149,112 149,100 153,91 C156,84 162,82 164,84 Z"
        fill={col('side_delt')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('side_delt')} />

      {/* Chest — large organic pec shapes */}
      <path d="M55,90 C46,97 44,118 49,136 C54,150 67,157 80,152 C92,147 96,134 91,118 C86,103 76,90 65,87 C61,86 57,88 55,90 Z"
        fill={col('chest')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('chest')} />
      <path d="M145,90 C154,97 156,118 151,136 C146,150 133,157 120,152 C108,147 104,134 109,118 C114,103 124,90 135,87 C139,86 143,88 145,90 Z"
        fill={col('chest')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('chest')} />

      {/* Abs — shaped panel */}
      <path d="M84,148 C82,155 82,172 84,182 C86,190 92,194 100,194 C108,194 114,190 116,182 C118,172 118,155 116,148 C114,142 108,138 100,138 C92,138 86,142 84,148 Z"
        fill={col('abs')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('abs')} />
      {col('abs') !== BASE && <>
        <line x1="84" y1="162" x2="116" y2="162" stroke={SKIN} strokeWidth="1.5" opacity="0.55"/>
        <line x1="84" y1="177" x2="116" y2="177" stroke={SKIN} strokeWidth="1.5" opacity="0.55"/>
        <line x1="100" y1="138" x2="100" y2="194" stroke={SKIN} strokeWidth="1.5" opacity="0.55"/>
      </>}

      {/* Biceps */}
      <path d="M27,116 C22,130 20,150 23,168 C25,178 32,181 38,178 C45,175 47,164 44,148 C41,132 36,116 30,112 C28,112 27,114 27,116 Z"
        fill={col('biceps')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('biceps')} />
      <path d="M173,116 C178,130 180,150 177,168 C175,178 168,181 162,178 C155,175 153,164 156,148 C159,132 164,116 170,112 C172,112 173,114 173,116 Z"
        fill={col('biceps')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('biceps')} />

      {/* Forearms */}
      <path d="M26,170 C20,188 20,212 23,232 L38,234 C38,214 38,190 43,173 Z"
        fill={col('forearms')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('forearms')} />
      <path d="M174,170 C180,188 180,212 177,232 L162,234 C162,214 162,190 157,173 Z"
        fill={col('forearms')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('forearms')} />

      {/* Quads */}
      <path d="M44,246 C38,270 36,298 38,320 L67,320 C65,298 63,270 59,246 Z"
        fill={col('quads')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('quads')} />
      <path d="M156,246 C162,270 164,298 162,320 L133,320 C135,298 137,270 141,246 Z"
        fill={col('quads')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('quads')} />

      {/* Adductors */}
      <path d="M60,248 C56,272 56,298 58,318 L68,318 C68,298 68,272 66,248 Z"
        fill={col('adductors')} opacity="0.75" style={{cursor:'pointer'}} onClick={()=>onClick?.('adductors')} />
      <path d="M140,248 C144,272 144,298 142,318 L132,318 C132,298 132,272 134,248 Z"
        fill={col('adductors')} opacity="0.75" style={{cursor:'pointer'}} onClick={()=>onClick?.('adductors')} />

      {/* Calves front */}
      <path d="M38,322 C34,344 36,370 40,392 L64,392 C66,370 66,344 64,322 Z"
        fill={col('calves')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('calves')} />
      <path d="M162,322 C166,344 164,370 160,392 L136,392 C130,370 130,344 132,322 Z"
        fill={col('calves')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('calves')} />

      <text x="100" y="422" textAnchor="middle" fontSize="10" fill="#555" fontWeight="700" letterSpacing="3">FRONT</text>
    </svg>
  )
}

function BackView({ pm = [], sm = [], onClick }) {
  const col = id => c(id, pm, sm)
  return (
    <svg viewBox="0 0 200 425" style={{ width: '100%', maxHeight: 390 }}>
      <BodySilhouette />

      {/* ── BACK MUSCLE OVERLAYS ── */}

      {/* Traps — wide kite from neck base to mid-back */}
      <path d="M72,78 C86,68 114,68 128,78 C120,98 110,106 100,108 C90,106 80,98 72,78 Z"
        fill={col('traps')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('traps')} />

      {/* Rear delts */}
      <path d="M48,82 C40,88 37,100 40,112 C43,122 51,126 58,122 C65,118 66,107 62,95 C59,85 53,79 48,82 Z"
        fill={col('rear_delt')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('rear_delt')} />
      <path d="M152,82 C160,88 163,100 160,112 C157,122 149,126 142,122 C135,118 134,107 138,95 C141,85 147,79 152,82 Z"
        fill={col('rear_delt')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('rear_delt')} />

      {/* Lats — V-shaped wings */}
      <path d="M48,100 C40,120 36,150 38,174 C40,188 52,194 64,188 C75,182 78,165 74,142 C70,118 60,100 52,96 Z"
        fill={col('lats')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('lats')} />
      <path d="M152,100 C160,120 164,150 162,174 C160,188 148,194 136,188 C125,182 122,165 126,142 C130,118 140,100 148,96 Z"
        fill={col('lats')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('lats')} />

      {/* Mid back (rhomboids) */}
      <path d="M74,118 C70,134 70,154 74,168 L126,168 C130,154 130,134 126,118 Z"
        fill={col('mid_back')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('mid_back')} />

      {/* Lower back */}
      <path d="M68,172 C64,184 64,200 66,212 L134,212 C136,200 136,184 132,172 Z"
        fill={col('lower_back')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('lower_back')} />

      {/* Triceps */}
      <path d="M27,116 C22,132 20,152 23,170 C25,180 32,183 38,180 C45,177 47,166 44,149 C41,132 36,116 30,112 Z"
        fill={col('triceps')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('triceps')} />
      <path d="M173,116 C178,132 180,152 177,170 C175,180 168,183 162,180 C155,177 153,166 156,149 C159,132 164,116 170,112 Z"
        fill={col('triceps')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('triceps')} />

      {/* Glutes */}
      <path d="M48,218 C42,230 40,246 44,258 C48,270 62,277 76,272 C88,267 91,254 86,240 C81,226 68,214 56,212 Z"
        fill={col('glutes')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('glutes')} />
      <path d="M152,218 C158,230 160,246 156,258 C152,270 138,277 124,272 C112,267 109,254 114,240 C119,226 132,214 144,212 Z"
        fill={col('glutes')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('glutes')} />

      {/* Hamstrings */}
      <path d="M44,256 C38,278 36,304 38,320 L67,320 C65,304 63,278 60,256 Z"
        fill={col('hamstrings')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('hamstrings')} />
      <path d="M156,256 C162,278 164,304 162,320 L133,320 C135,304 137,278 140,256 Z"
        fill={col('hamstrings')} opacity="0.88" style={{cursor:'pointer'}} onClick={()=>onClick?.('hamstrings')} />

      {/* Calves back */}
      <path d="M38,322 C34,346 36,372 40,394 L65,394 C67,372 66,346 64,322 Z"
        fill={col('calves')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('calves')} />
      <path d="M162,322 C166,346 164,372 160,394 L135,394 C131,372 130,346 132,322 Z"
        fill={col('calves')} opacity="0.85" style={{cursor:'pointer'}} onClick={()=>onClick?.('calves')} />

      <text x="100" y="422" textAnchor="middle" fontSize="10" fill="#555" fontWeight="700" letterSpacing="3">BACK</text>
    </svg>
  )
}

export default function MuscleBodyMap({ primaryMuscles = [], secondaryMuscles = [], onMuscleClick, compact = false }) {
  const frontPrimary   = primaryMuscles.filter(m => FRONT_IDS.has(m))
  const backPrimary    = primaryMuscles.filter(m => BACK_IDS.has(m))
  const frontSecondary = secondaryMuscles.filter(m => FRONT_IDS.has(m))
  const backSecondary  = secondaryMuscles.filter(m => BACK_IDS.has(m))

  const w = compact ? 'w-28' : 'w-36'
  return (
    <div className={`flex justify-center gap-${compact ? 2 : 6}`}>
      <div className={w}><FrontView pm={frontPrimary} sm={frontSecondary} onClick={onMuscleClick} /></div>
      <div className={w}><BackView  pm={backPrimary}  sm={backSecondary}  onClick={onMuscleClick} /></div>
    </div>
  )
}
