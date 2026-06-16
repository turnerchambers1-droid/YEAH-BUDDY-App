import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { X } from 'lucide-react'
import { playLunkAlarm, playRestComplete } from '../utils/audio'

const PRESETS = [60, 90, 120, 180]

// ── Notification helpers ───────────────────────────────────────────────────
function requestNotifPermission() {
  if (!('Notification' in window) || Notification.permission !== 'default') return
  Notification.requestPermission()
}

async function fireRestNotification(duration) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const mins = duration >= 60 ? `${Math.round(duration / 60)}m` : `${duration}s`
    const opts = {
      body: `${mins} rest complete — time to lift!`,
      tag: 'rest-timer',
      requireInteraction: false,
    }
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg?.showNotification) { reg.showNotification('Rest over — back to work! 💪', opts); return }
    }
    const n = new Notification('Rest over — back to work! 💪', opts)
    setTimeout(() => n.close(), 6000)
  } catch {}
}

// ── SVG tick marks ─────────────────────────────────────────────────────────
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

// ── RestTimer ──────────────────────────────────────────────────────────────
const RestTimer = forwardRef(function RestTimer({ onClose, inline = false, voiceMode = 'positive', onStart }, ref) {
  const [duration,  setDuration]  = useState(60)
  const [remaining, setRemaining] = useState(60)
  const [running,   setRunning]   = useState(false)
  const [ding,      setDing]      = useState(false)

  const intervalRef = useRef(null)
  // Absolute end timestamp — survives background throttling
  const endTimeRef  = useRef(null)
  // Refs mirror state so interval/visibility callbacks don't go stale
  const durationRef  = useRef(60)
  const remainingRef = useRef(60)

  useEffect(() => { durationRef.current  = duration  }, [duration])
  useEffect(() => { remainingRef.current = remaining }, [remaining])

  const handleTimerEnd = useCallback(() => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    setRunning(false)
    setRemaining(0)
    try { playLunkAlarm() } catch {}
    try { playRestComplete(voiceMode === 'negative') } catch {}
    setDing(true)
    setTimeout(() => setDing(false), 2500)
    if (navigator.vibrate) navigator.vibrate([300, 150, 300])
    fireRestNotification(durationRef.current)
  }, [])

  // Timestamp-based countdown — accurate after background throttling
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return }

    let lastDisplayed = remainingRef.current

    intervalRef.current = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      if (rem <= 0) { handleTimerEnd(); return }
      if (rem !== lastDisplayed) {
        lastDisplayed = rem
        setRemaining(rem)
      }
    }, 250)

    return () => clearInterval(intervalRef.current)
  }, [running, handleTimerEnd])

  // When the tab returns to foreground, recalculate from endTime
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden || !endTimeRef.current) return
      const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      if (rem <= 0) handleTimerEnd()
      else setRemaining(rem)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [handleTimerEnd])

  const autoStart = useCallback(() => {
    clearInterval(intervalRef.current)
    const dur = durationRef.current
    setRemaining(dur)
    setDing(false)
    endTimeRef.current = Date.now() + dur * 1000
    setRunning(true)
    requestNotifPermission()
    onStart?.()
  }, [onStart])

  useImperativeHandle(ref, () => ({ start: autoStart }), [autoStart])

  const toggleRunning = useCallback(() => {
    requestNotifPermission()
    setRunning(prev => {
      if (prev) {
        // Pause — cancel the end timestamp
        endTimeRef.current = null
      } else {
        // Start / resume — set end timestamp from current remaining (auto-reset if at 0)
        const rem = remainingRef.current === 0 ? durationRef.current : remainingRef.current
        if (remainingRef.current === 0) setRemaining(durationRef.current)
        endTimeRef.current = Date.now() + rem * 1000
        onStart?.()
      }
      return !prev
    })
  }, [onStart])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    setRunning(false)
    setRemaining(durationRef.current)
    setDing(false)
  }, [])

  const selectPreset = useCallback(s => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    setDuration(s)
    setRemaining(s)
    setRunning(false)
    setDing(false)
  }, [])

  // ── SVG params ─────────────────────────────────────────────────────────────
  const CX = 110, CY = 110, R = 90, OUTER = R + 2
  const circ    = 2 * Math.PI * R
  const progress  = duration > 0 ? (duration - remaining) / duration : 0
  const handAngle = -90 + progress * 360
  const handX = CX + (R - 18) * Math.cos(handAngle * Math.PI / 180)
  const handY = CY + (R - 18) * Math.sin(handAngle * Math.PI / 180)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const pct = duration > 0 ? Math.round(remaining / duration * 100) : 0

  // ── Shared clock face ─────────────────────────────────────────────────────
  const clockFace = (width, height, fontSize, subFontSize) => (
    <svg width={width} height={height} viewBox="0 0 220 220">
      <circle cx={CX} cy={CY} r={OUTER + 6} fill="none" stroke="#c8b97a" strokeWidth="3" opacity="0.6" />
      <circle cx={CX} cy={CY} r={OUTER} fill="#111" stroke="#333" strokeWidth="1" />
      <defs>
        <radialGradient id="faceGrad" cx="40%" cy="35%">
          <stop offset="0%"   stopColor="#1e1e1e" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#080808" stopOpacity="1"/>
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={OUTER} fill="url(#faceGrad)" />
      <Ticks r={R} cx={CX} cy={CY} />
      {[{v:'12',a:-90},{v:'3',a:0},{v:'6',a:90},{v:'9',a:180}].map(({v,a}) => {
        const nr = R - 16
        return <text key={v} x={CX + nr * Math.cos(a * Math.PI / 180)} y={CY + nr * Math.sin(a * Math.PI / 180) + 4}
          textAnchor="middle" fontSize="11" fill="#c8b97a" fontFamily="Courier New, monospace" fontWeight="bold">{v}</text>
      })}
      <circle cx={CX} cy={CY} r={R - 4} fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={progress * circ}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px`, transition: 'stroke-dashoffset 0.8s linear' }}
        opacity="0.85" />
      <line x1={CX} y1={CY} x2={handX} y2={handY}
        stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"
        style={{ transformOrigin: `${CX}px ${CY}px`, transition: 'all 0.8s linear' }} />
      <circle cx={CX} cy={CY} r="5" fill="#c8b97a" />
      <circle cx={CX} cy={CY} r="2.5" fill="#111" />
      <text x={CX} y={CY - (fontSize > 28 ? 14 : 10)} textAnchor="middle" fontSize={fontSize}
        fontFamily="Courier New, monospace" fontWeight="bold"
        fill={ding ? '#22c55e' : '#f5f5f5'} letterSpacing="3">{mm}:{ss}</text>
      <text x={CX} y={CY + (fontSize > 28 ? 8 : 6)} textAnchor="middle" fontSize={subFontSize}
        fontFamily="Courier New, monospace" fill="#555" letterSpacing="1">
        {ding ? '— DONE —' : `${pct}%`}
      </text>
    </svg>
  )

  // ── Inline (compact, embedded in workout screen) ───────────────────────────
  if (inline) return (
    <div className="rounded-2xl py-3 px-4 mb-3" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0" style={{ filter: ding ? 'drop-shadow(0 0 10px #22c55e)' : 'none', transition: 'filter 0.3s' }}>
          {clockFace(72, 72, 30, 11)}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#c8b97a', fontFamily: 'Courier New, monospace' }}>REST TIMER</span>
          <div className="flex items-center gap-3">
            <button onClick={toggleRunning}
              className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-base font-bold active:scale-95 transition-all"
              style={{ background: running ? '#1a1a1a' : '#22c55e', color: running ? '#22c55e' : '#000', border: running ? '2px solid #22c55e' : 'none', boxShadow: running ? '0 0 16px #22c55e44' : '0 4px 16px #22c55e55' }}>
              {running ? '⏸' : '▶'}
            </button>
            <button onClick={reset} className="px-3 py-1.5 rounded-full font-mono text-xs font-bold" style={{ background: '#1a1a1a', color: '#c8b97a', border: '1px solid #333' }}>RST</button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(s => (
              <button key={s} onClick={() => selectPreset(s)}
                className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold"
                style={{ background: duration === s ? '#22c55e22' : '#1a1a1a', color: duration === s ? '#22c55e' : '#555', border: duration === s ? '1px solid #22c55e55' : '1px solid #222' }}>
                {s < 60 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Full modal ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-3xl flex flex-col items-center gap-5 pb-10"
        style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between px-5 pt-5">
          <span className="font-bold text-base tracking-widest uppercase" style={{ color: '#c8b97a', fontFamily: 'Courier New, monospace' }}>REST TIMER</span>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><X size={20} /></button>
        </div>

        <div style={{ filter: ding ? 'drop-shadow(0 0 16px #22c55e)' : 'none', transition: 'filter 0.3s' }}>
          {clockFace(220, 220, 32, 12)}
        </div>

        <div className="flex items-center gap-6">
          <button onClick={reset}
            className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-sm font-bold"
            style={{ background: '#1a1a1a', color: '#c8b97a', border: '1px solid #333' }}>RST</button>
          <button onClick={toggleRunning}
            className="w-20 h-20 rounded-full flex items-center justify-center font-mono text-lg font-bold transition-all active:scale-95"
            style={{ background: running ? '#1a1a1a' : '#22c55e', color: running ? '#22c55e' : '#000', border: running ? '2px solid #22c55e' : 'none', boxShadow: running ? '0 0 20px #22c55e44' : '0 4px 20px #22c55e66' }}>
            {running ? '⏸' : '▶'}
          </button>
          <div className="w-12 h-12" />
        </div>

        <div className="flex gap-3">
          {PRESETS.map(s => (
            <button key={s} onClick={() => selectPreset(s)}
              className="px-4 py-2 rounded-full text-sm font-mono font-semibold"
              style={{ background: duration === s ? '#22c55e22' : '#1a1a1a', color: duration === s ? '#22c55e' : '#666', border: duration === s ? '1px solid #22c55e66' : '1px solid #2a2a2a' }}>
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default RestTimer
