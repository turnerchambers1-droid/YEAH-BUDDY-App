// Anatomically-accurate SVG muscle map — styled after reference diagram
// No text labels on the figure itself; muscles highlight on active exercises

const ACCENT    = '#22c55e'   // primary muscle — solid green
const SECONDARY = '#99f6e4'   // secondary muscle — light teal
const BASE      = '#2a2a2a'   // inactive
const SKIN      = '#1c1c1c'   // body fill
const OUTLINE   = '#3a3a3a'   // body stroke
const DEFLINE   = '#2e2e2e'   // anatomy definition lines (always visible)

const FRONT_IDS = new Set(['chest','front_delt','side_delt','biceps','forearms','abs','quads','calves','adductors','abductors'])
const BACK_IDS  = new Set(['traps','lats','mid_back','lower_back','rear_delt','triceps','glutes','hamstrings','calves'])

function c(id, primary, secondary) {
  if (primary.includes(id))   return ACCENT
  if (secondary.includes(id)) return SECONDARY
  return BASE
}

// Shared anatomical silhouette — athletic proportions matching reference
function BodySilhouette() {
  return (
    <g fill={SKIN} stroke={OUTLINE} strokeWidth="1.2">
      {/* Head */}
      <ellipse cx="100" cy="26" rx="18" ry="21" />
      {/* Neck */}
      <path d="M91,44 C89,50 88,58 89,65 L111,65 C112,58 111,50 109,44 C106,42 94,42 91,44 Z" />
      {/* Torso — shoulders, chest flare, waist taper, hip flare */}
      <path d="
        M89,65
        C78,67 58,72 40,84
        C28,93 24,112 24,134
        C24,155 28,172 34,188
        C38,200 40,212 41,222
        L159,222
        C160,212 162,200 166,188
        C172,172 176,155 176,134
        C176,112 172,93 160,84
        C142,72 122,67 111,65
        Z" />
      {/* Left upper arm */}
      <path d="M40,84 C32,90 20,114 16,146 C14,160 16,173 18,178 L36,170 C34,160 32,145 34,122 C36,106 44,93 52,85 Z" />
      {/* Right upper arm */}
      <path d="M160,84 C168,90 180,114 184,146 C186,160 184,173 182,178 L164,170 C166,160 168,145 166,122 C164,106 156,93 148,85 Z" />
      {/* Left forearm */}
      <path d="M18,178 C12,196 12,220 14,242 L32,244 C32,222 32,198 36,180 Z" />
      {/* Right forearm */}
      <path d="M182,178 C188,196 188,220 186,242 L168,244 C168,222 168,198 164,180 Z" />
      {/* Hands */}
      <path d="M14,242 C10,252 12,263 22,265 C32,267 34,257 32,246 Z" />
      <path d="M186,242 C190,252 188,263 178,265 C168,267 166,257 168,246 Z" />
      {/* Hip/groin bridge */}
      <path d="M41,222 C38,234 36,248 38,260 L162,260 C164,248 162,234 159,222 Z" />
      {/* Left thigh */}
      <path d="M38,260 C32,286 30,316 32,340 L64,340 C62,316 60,286 58,260 Z" />
      {/* Right thigh */}
      <path d="M162,260 C168,286 170,316 168,340 L136,340 C138,316 140,286 142,260 Z" />
      {/* Left lower leg */}
      <path d="M32,342 C28,370 30,400 34,420 L62,420 C64,400 64,370 62,342 Z" />
      {/* Right lower leg */}
      <path d="M168,342 C172,370 170,400 166,420 L138,420 C134,400 134,370 136,342 Z" />
      {/* Feet */}
      <path d="M34,420 C28,428 26,438 44,440 C58,441 64,432 62,420 Z" />
      <path d="M166,420 C172,428 174,438 156,440 C142,441 136,432 138,420 Z" />
    </g>
  )
}

function FrontView({ pm = [], sm = [], onClick }) {
  const col = id => c(id, pm, sm)
  const hit = id => ({ fill: col(id), opacity: 0.90, style: { cursor: 'pointer' }, onClick: () => onClick?.(id) })

  return (
    <svg viewBox="0 0 200 450" style={{ width: '100%', maxHeight: 400 }}>
      <BodySilhouette />

      {/* ── FRONT DELTOID ── rounded cap front of shoulder */}
      <path d="M40,80 C32,86 28,98 30,112 C32,122 40,127 48,123 C56,119 58,108 55,96 C52,85 45,78 40,80 Z" {...hit('front_delt')} />
      <path d="M160,80 C168,86 172,98 170,112 C168,122 160,127 152,123 C144,119 142,108 145,96 C148,85 155,78 160,80 Z" {...hit('front_delt')} />

      {/* ── SIDE DELTOID ── outer cap of shoulder */}
      <path d="M26,82 C18,88 15,102 19,115 C22,124 30,126 36,121 C42,116 43,103 39,92 C36,84 29,80 26,82 Z" {...hit('side_delt')} />
      <path d="M174,82 C182,88 185,102 181,115 C178,124 170,126 164,121 C158,116 157,103 161,92 C164,84 171,80 174,82 Z" {...hit('side_delt')} />

      {/* ── CHEST / PECTORALIS MAJOR ── fan-shaped, two heads */}
      {/* Left pec — from sternum, fans out to armpit */}
      <path d="M97,78 C88,74 68,76 50,88 C42,95 38,108 43,120 C47,130 58,136 73,132 C87,128 96,116 97,103 Z" {...hit('chest')} />
      {/* Right pec */}
      <path d="M103,78 C112,74 132,76 150,88 C158,95 162,108 157,120 C153,130 142,136 127,132 C113,128 104,116 103,103 Z" {...hit('chest')} />
      {/* Sternal division line */}
      <line x1="100" y1="76" x2="100" y2="132" stroke={DEFLINE} strokeWidth="1.2" opacity="0.6" />

      {/* ── ABS / RECTUS ABDOMINIS ── 6-pack grid */}
      {/* Outer shape */}
      <path d="M82,138 C79,148 79,168 81,182 C83,194 90,200 100,200 C110,200 117,194 119,182 C121,168 121,148 118,138 C115,130 108,126 100,126 C92,126 85,130 82,138 Z" {...hit('abs')} />
      {/* Always-visible anatomy lines */}
      <line x1="100" y1="126" x2="100" y2="200" stroke={DEFLINE} strokeWidth="1.5" opacity="0.7" />
      <line x1="81"  y1="152" x2="119" y2="152" stroke={DEFLINE} strokeWidth="1.2" opacity="0.6" />
      <line x1="80"  y1="170" x2="120" y2="170" stroke={DEFLINE} strokeWidth="1.2" opacity="0.6" />
      <line x1="81"  y1="186" x2="119" y2="186" stroke={DEFLINE} strokeWidth="1.2" opacity="0.5" />

      {/* ── SERRATUS / OBLIQUES ── sides of torso */}
      <path d="M55,128 C48,136 46,152 48,168 C50,178 58,182 66,178 C74,172 76,158 72,144 C68,130 62,124 55,128 Z" {...hit('abs')} />
      <path d="M145,128 C152,136 154,152 152,168 C150,178 142,182 134,178 C126,172 124,158 128,144 C132,130 138,124 145,128 Z" {...hit('abs')} />

      {/* ── BICEPS ── front of upper arm */}
      <path d="M18,118 C12,134 10,156 13,176 C15,187 23,191 30,188 C38,184 40,172 37,154 C34,136 28,118 22,114 Z" {...hit('biceps')} />
      <path d="M182,118 C188,134 190,156 187,176 C185,187 177,191 170,188 C162,184 160,172 163,154 C166,136 172,118 178,114 Z" {...hit('biceps')} />

      {/* ── FOREARMS ── */}
      <path d="M16,176 C10,196 10,222 12,244 L30,246 C30,224 30,198 34,180 Z" {...hit('forearms')} />
      <path d="M184,176 C190,196 190,222 188,244 L170,246 C170,224 170,198 166,180 Z" {...hit('forearms')} />

      {/* ── QUADS ── front of thigh, 3 regions */}
      {/* Vastus lateralis (outer) */}
      <path d="M38,262 C30,290 28,320 30,342 L52,342 C50,320 50,290 52,262 Z" {...hit('quads')} />
      {/* Rectus femoris (center) */}
      <path d="M54,262 C50,290 50,320 52,340 L70,340 C70,320 68,290 66,262 Z" {...hit('quads')} />
      <path d="M146,262 C150,290 150,320 148,340 L130,340 C130,320 132,290 134,262 Z" {...hit('quads')} />
      <path d="M162,262 C170,290 172,320 170,342 L148,342 C150,320 150,290 148,262 Z" {...hit('quads')} />
      {/* Vastus medialis teardrop near knee */}
      <path d="M66,318 C62,326 62,336 66,340 C70,344 76,342 78,336 C80,328 78,318 72,315 Z" {...hit('quads')} />
      <path d="M134,318 C138,326 138,336 134,340 C130,344 124,342 122,336 C120,328 122,318 128,315 Z" {...hit('quads')} />
      {/* Definition line between heads */}
      <line x1="54" y1="262" x2="52" y2="340" stroke={DEFLINE} strokeWidth="1" opacity="0.5" />
      <line x1="146" y1="262" x2="148" y2="340" stroke={DEFLINE} strokeWidth="1" opacity="0.5" />

      {/* ── ADDUCTORS ── inner thigh */}
      <path d="M70,264 C66,290 66,318 68,340 L80,340 C80,318 80,290 78,264 Z" {...hit('adductors')} />
      <path d="M130,264 C134,290 134,318 132,340 L120,340 C120,318 120,290 122,264 Z" {...hit('adductors')} />

      {/* ── CALVES (front = tibialis anterior) ── */}
      <path d="M32,344 C28,368 30,396 34,418 L56,418 C58,396 58,368 56,344 Z" {...hit('calves')} />
      <path d="M168,344 C172,368 170,396 166,418 L144,418 C142,396 142,368 144,344 Z" {...hit('calves')} />

      <text x="100" y="447" textAnchor="middle" fontSize="9" fill="#444" fontWeight="700" letterSpacing="3">FRONT</text>
    </svg>
  )
}

function BackView({ pm = [], sm = [], onClick }) {
  const col = id => c(id, pm, sm)
  const hit = id => ({ fill: col(id), opacity: 0.90, style: { cursor: 'pointer' }, onClick: () => onClick?.(id) })

  return (
    <svg viewBox="0 0 200 450" style={{ width: '100%', maxHeight: 400 }}>
      <BodySilhouette />

      {/* ── TRAPEZIUS ── diamond/kite from neck to mid-back */}
      {/* Upper traps (left & right slopes) */}
      <path d="M100,68 C92,65 72,70 50,84 C44,90 44,100 52,106 C60,112 72,108 82,100 C90,94 96,84 100,76 Z" {...hit('traps')} />
      <path d="M100,68 C108,65 128,70 150,84 C156,90 156,100 148,106 C140,112 128,108 118,100 C110,94 104,84 100,76 Z" {...hit('traps')} />
      {/* Mid traps (horizontal, between blades) */}
      <path d="M72,108 C68,118 68,130 72,138 L128,138 C132,130 132,118 128,108 Z" {...hit('traps')} />
      {/* Lower traps (down to mid-back) */}
      <path d="M80,138 C76,150 78,162 86,168 L100,164 L114,168 C122,162 124,150 120,138 Z" {...hit('traps')} />
      {/* Spine line */}
      <line x1="100" y1="68" x2="100" y2="168" stroke={DEFLINE} strokeWidth="1.2" opacity="0.5" />

      {/* ── REAR DELTOID ── */}
      <path d="M40,80 C32,87 28,100 31,114 C34,124 42,128 50,124 C58,120 60,108 56,96 C52,85 45,78 40,80 Z" {...hit('rear_delt')} />
      <path d="M160,80 C168,87 172,100 169,114 C166,124 158,128 150,124 C142,120 140,108 144,96 C148,85 155,78 160,80 Z" {...hit('rear_delt')} />

      {/* ── LATS / LATISSIMUS DORSI ── V-shaped wings */}
      <path d="M50,100 C40,122 34,154 36,180 C38,196 50,204 64,198 C76,192 80,174 76,150 C72,126 62,104 54,98 Z" {...hit('lats')} />
      <path d="M150,100 C160,122 166,154 164,180 C162,196 150,204 136,198 C124,192 120,174 124,150 C128,126 138,104 146,98 Z" {...hit('lats')} />

      {/* ── RHOMBOIDS / MID BACK ── between shoulder blades */}
      <path d="M76,112 C72,126 72,148 76,162 C80,170 90,172 100,170 C110,172 120,170 124,162 C128,148 128,126 124,112 C118,106 108,102 100,102 C92,102 82,106 76,112 Z" {...hit('mid_back')} />

      {/* ── LOWER BACK / ERECTOR SPINAE ── two columns */}
      <path d="M68,172 C64,186 64,204 68,218 C72,226 80,228 86,224 L100,222 L114,224 C120,228 128,226 132,218 C136,204 136,186 132,172 C124,166 112,162 100,162 C88,162 76,166 68,172 Z" {...hit('lower_back')} />
      {/* Spine division */}
      <line x1="100" y1="162" x2="100" y2="222" stroke={DEFLINE} strokeWidth="1.2" opacity="0.5" />

      {/* ── TRICEPS ── back of upper arm (horseshoe) */}
      <path d="M18,116 C12,134 10,158 13,178 C15,190 24,195 32,191 C40,187 42,174 39,155 C36,136 30,118 24,113 Z" {...hit('triceps')} />
      <path d="M182,116 C188,134 190,158 187,178 C185,190 176,195 168,191 C160,187 158,174 161,155 C164,136 170,118 176,113 Z" {...hit('triceps')} />

      {/* ── GLUTES / GLUTEUS MAXIMUS ── large round masses */}
      <path d="M42,228 C34,242 32,260 36,274 C40,286 55,294 70,289 C84,284 88,268 83,252 C78,236 64,222 52,220 Z" {...hit('glutes')} />
      <path d="M158,228 C166,242 168,260 164,274 C160,286 145,294 130,289 C116,284 112,268 117,252 C122,236 136,222 148,220 Z" {...hit('glutes')} />
      {/* Glute line */}
      <line x1="100" y1="222" x2="100" y2="290" stroke={DEFLINE} strokeWidth="1.2" opacity="0.4" />

      {/* ── HAMSTRINGS ── back of thigh */}
      {/* Biceps femoris (outer) */}
      <path d="M38,272 C32,298 30,324 32,342 L56,342 C54,324 54,298 52,272 Z" {...hit('hamstrings')} />
      {/* Semitendinosus (inner) */}
      <path d="M56,272 C54,298 54,324 56,342 L72,342 C72,324 70,298 68,272 Z" {...hit('hamstrings')} />
      <path d="M144,272 C146,298 146,324 144,342 L128,342 C128,324 130,298 132,272 Z" {...hit('hamstrings')} />
      <path d="M162,272 C168,298 170,324 168,342 L148,342 C148,324 148,298 148,272 Z" {...hit('hamstrings')} />
      <line x1="56" y1="272" x2="56" y2="342" stroke={DEFLINE} strokeWidth="1" opacity="0.4" />
      <line x1="144" y1="272" x2="144" y2="342" stroke={DEFLINE} strokeWidth="1" opacity="0.4" />

      {/* ── CALVES / GASTROCNEMIUS ── diamond shape back of lower leg */}
      <path d="M32,344 C27,362 26,382 28,400 C30,412 40,420 50,418 C60,416 64,406 64,394 C64,376 60,356 56,344 Z" {...hit('calves')} />
      <path d="M168,344 C173,362 174,382 172,400 C170,412 160,420 150,418 C140,416 136,406 136,394 C136,376 140,356 144,344 Z" {...hit('calves')} />
      {/* Gastrocnemius split line */}
      <line x1="44" y1="344" x2="44" y2="410" stroke={DEFLINE} strokeWidth="1" opacity="0.4" />
      <line x1="156" y1="344" x2="156" y2="410" stroke={DEFLINE} strokeWidth="1" opacity="0.4" />

      <text x="100" y="447" textAnchor="middle" fontSize="9" fill="#444" fontWeight="700" letterSpacing="3">BACK</text>
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
