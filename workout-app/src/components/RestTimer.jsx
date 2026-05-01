import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

const PRESETS = [60, 90, 120, 180]

// Web Audio tick using oscillator
function createTick(ctx) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.frequency.value = 1200
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
  osc.start(); osc.stop(ctx.currentTime + 0.06)
}

function createDing(ctx) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'; osc.frequency.value = 880
  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
  osc.start(); osc.stop(ctx.currentTime + 1.5)
}

// Generate clock tick marks
function Ticks({ r, cx, cy }) {
  const marks = []
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * (Math.PI / 180)
    const isMajor = i % 5 === 0
    const inner = r - (isMajor ? 9 : 5)
    marks.push(
      <line
        key={i}
        x1={cx + inner * Math.cos(angle)} y1={cy + inner * Math.sin(angle)}
        x2={cx + r     * Math.cos(angle)} y2={cy + r     * Math.sin(angle)}
        stroke={isMajor ? '#c8b97a' : '#555'}
        strokeWidth={isMajor ? 2 : 1}
        strokeLinecap="round"
      />
    )
  }
  return <>{marks}</>
}

export default function RestTimer({ onClose, inline = false, compact = false }) {
  const [duration,  setDuration]  = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running,   setRunning]   = useState(false)
  const [ding,      setDing]      = useState(false)
  const audioCtx = useRef(null)
  const intervalRef = useRef(null)

  const getCtx = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    return audioCtx.current
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            try { createDing(getCtx()) } catch {}
            setDing(true); setTimeout(() => setDing(false), 2000)
            if (navigator.vibrate) navigator.vibrate([300, 150, 300])
            return 0
          }
          try { createTick(getCtx()) } catch {}
          return r - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const reset = () => { setRunning(false); setRemaining(duration); setDing(false) }
  const selectPreset = s => { setDuration(s); setRemaining(s); setRunning(false); setDing(false) }

  // SVG params
  const CX = 110, CY = 110, R = 90
  const OUTER = R + 2
  const circ  = 2 * Math.PI * R
  const progress = duration > 0 ? (duration - remaining) / duration : 0
  const dashOffset = circ * (1 - progress)

  // Sweep hand angle
  const handAngle = -90 + progress * 360
  const handX = CX + (R - 18) * Math.cos(handAngle * Math.PI / 180)
  const handY = CY + (R - 18) * Math.sin(handAngle * Math.PI / 180)

  const mm  = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss  = String(remaining % 60).padStart(2, '0')
  const pct = duration > 0 ? Math.round(remaining / duration * 100) : 0

  if (inline) return (
    <div className="rounded-2xl py-3 px-4 mb-3" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
      <div className="flex items-center gap-4">
        {/* Compact clock face */}
        <div className="flex-shrink-0" style={{ filter: ding ? 'drop-shadow(0 0 10px #22c55e)' : 'none', transition: 'filter 0.3s' }}>
          <svg width="72" height="72" viewBox="0 0 220 220">
            <circle cx={CX} cy={CY} r={OUTER+6} fill="none" stroke="#c8b97a" strokeWidth="3" opacity="0.6" />
            <circle cx={CX} cy={CY} r={OUTER} fill="#111" stroke="#333" strokeWidth="1" />
            <defs><radialGradient id="fgI" cx="40%" cy="35%"><stop offset="0%" stopColor="#1e1e1e" stopOpacity="0.8"/><stop offset="100%" stopColor="#080808" stopOpacity="1"/></radialGradient></defs>
            <circle cx={CX} cy={CY} r={OUTER} fill="url(#fgI)" />
            <Ticks r={R} cx={CX} cy={CY} />
            <circle cx={CX} cy={CY} r={R-4} fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={progress*circ}
              style={{ transform:'rotate(-90deg)', transformOrigin:`${CX}px ${CY}px`, transition:'stroke-dashoffset 0.8s linear' }} opacity="0.85" />
            <line x1={CX} y1={CY} x2={handX} y2={handY} stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r="5" fill="#c8b97a" />
            <circle cx={CX} cy={CY} r="2.5" fill="#111" />
            <text x={CX} y={CY-10} textAnchor="middle" fontSize="30" fontFamily="Courier New, monospace" fontWeight="bold" fill={ding ? '#22c55e' : '#f5f5f5'} letterSpacing="2">{mm}:{ss}</text>
            <text x={CX} y={CY+10} textAnchor="middle" fontSize="11" fontFamily="Courier New, monospace" fill="#555">{ding ? 'DONE' : `${pct}%`}</text>
          </svg>
        </div>

        {/* Controls + presets stacked */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#c8b97a', fontFamily: 'Courier New, monospace' }}>REST TIMER</span>
          <div className="flex items-center gap-3">
            <button onClick={() => { if(audioCtx.current) audioCtx.current.resume(); setRunning(r=>!r) }}
              className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-base font-bold active:scale-95 transition-all"
              style={{ background:running?'#1a1a1a':'#22c55e', color:running?'#22c55e':'#000', border:running?'2px solid #22c55e':'none', boxShadow:running?'0 0 16px #22c55e44':'0 4px 16px #22c55e55' }}>
              {running ? '⏸' : '▶'}
            </button>
            <button onClick={reset} className="px-3 py-1.5 rounded-full font-mono text-xs font-bold" style={{ background:'#1a1a1a', color:'#c8b97a', border:'1px solid #333' }}>RST</button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(s => (
              <button key={s} onClick={() => selectPreset(s)}
                className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold"
                style={{ background:duration===s?'#22c55e22':'#1a1a1a', color:duration===s?'#22c55e':'#555', border:duration===s?'1px solid #22c55e55':'1px solid #222' }}>
                {s<60?`${s}s`:`${s/60}m`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-3xl flex flex-col items-center gap-5 pb-10"
        style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between px-5 pt-5">
          <span className="font-bold text-base tracking-widest uppercase" style={{ color: '#c8b97a', fontFamily: 'Courier New, monospace' }}>REST TIMER</span>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><X size={20} /></button>
        </div>

        {/* Stopwatch face */}
        <div className="relative" style={{ filter: ding ? 'drop-shadow(0 0 16px #22c55e)' : 'none', transition: 'filter 0.3s' }}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            {/* Outer brass ring */}
            <circle cx={CX} cy={CY} r={OUTER + 6} fill="none" stroke="#c8b97a" strokeWidth="3" opacity="0.6" />
            {/* Clock face */}
            <circle cx={CX} cy={CY} r={OUTER} fill="#111" stroke="#333" strokeWidth="1" />
            {/* Radial gradient overlay */}
            <defs>
              <radialGradient id="faceGrad" cx="40%" cy="35%">
                <stop offset="0%"   stopColor="#1e1e1e" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#080808" stopOpacity="1"/>
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={OUTER} fill="url(#faceGrad)" />

            {/* Tick marks */}
            <Ticks r={R} cx={CX} cy={CY} />

            {/* 12 / 3 / 6 / 9 numerals */}
            {[{v:'12',a:-90},{v:'3',a:0},{v:'6',a:90},{v:'9',a:180}].map(({v,a}) => {
              const nr = R - 16
              const nx = CX + nr * Math.cos(a * Math.PI / 180)
              const ny = CY + nr * Math.sin(a * Math.PI / 180) + 4
              return <text key={v} x={nx} y={ny} textAnchor="middle" fontSize="11" fill="#c8b97a" fontFamily="Courier New, monospace" fontWeight="bold">{v}</text>
            })}

            {/* Green arc — shrinks as time runs */}
            <circle
              cx={CX} cy={CY} r={R - 4}
              fill="none"
              stroke={ding ? '#22c55e' : '#22c55e'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={progress * circ}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px`, transition: 'stroke-dashoffset 0.8s linear' }}
              opacity="0.85"
            />

            {/* Sweep hand */}
            <line
              x1={CX} y1={CY}
              x2={handX} y2={handY}
              stroke="#22c55e" strokeWidth="2" strokeLinecap="round"
              style={{ transformOrigin: `${CX}px ${CY}px`, transition: 'all 0.8s linear' }}
            />
            {/* Center pip */}
            <circle cx={CX} cy={CY} r="5" fill="#c8b97a" />
            <circle cx={CX} cy={CY} r="2.5" fill="#111" />

            {/* Time display */}
            <text x={CX} y={CY - 14} textAnchor="middle" fontSize="32" fontFamily="Courier New, monospace" fontWeight="bold" fill={ding ? '#22c55e' : '#f5f5f5'} letterSpacing="3">
              {mm}:{ss}
            </text>
            <text x={CX} y={CY + 8} textAnchor="middle" fontSize="12" fontFamily="Courier New, monospace" fill="#555" letterSpacing="1">
              {ding ? '— DONE —' : `${pct}%`}
            </text>
          </svg>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={reset}
            className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-sm font-bold transition-colors"
            style={{ background: '#1a1a1a', color: '#c8b97a', border: '1px solid #333' }}
          >RST</button>
          <button
            onClick={() => { if (audioCtx.current) audioCtx.current.resume(); setRunning(r => !r) }}
            className="w-20 h-20 rounded-full flex items-center justify-center font-mono text-lg font-bold transition-all active:scale-95"
            style={{ background: running ? '#1a1a1a' : '#22c55e', color: running ? '#22c55e' : '#000', border: running ? '2px solid #22c55e' : 'none', boxShadow: running ? '0 0 20px #22c55e44' : '0 4px 20px #22c55e66' }}
          >
            {running ? '⏸' : '▶'}
          </button>
          <div className="w-12 h-12" />
        </div>

        {/* Presets */}
        <div className="flex gap-3">
          {PRESETS.map(s => (
            <button key={s} onClick={() => selectPreset(s)}
              className="px-4 py-2 rounded-full text-sm font-mono font-semibold transition-colors"
              style={{
                background: duration === s ? '#22c55e22' : '#1a1a1a',
                color:      duration === s ? '#22c55e'   : '#666',
                border:     duration === s ? '1px solid #22c55e66' : '1px solid #2a2a2a',
              }}>
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
