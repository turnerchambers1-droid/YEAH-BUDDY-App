const RONNIE_FINISH_LINES = [
  "YEAH BUDDY! LIGHTWEIGHT BABY! That workout is DONE!",
  "Ain't nothin' but a peanut! You CRUSHED it today!",
  "Everybody wanna be a bodybuilder, but don't nobody wanna lift no heavy-ass weights — YOU DO! YEAH BUDDY!",
  "Light weight baby! Another session in the books!",
  "That's what I'm talkin' about! You put in the WORK today!",
  "Unbelievable! You went BEAST MODE on that workout!",
  "Another day, another workout DEMOLISHED! YEAH BUDDY!",
  "You didn't come here to play — you came here to TRAIN! And you did it! LIGHTWEIGHT BABY!",
  "You just separated yourself from the competition! YEAH BUDDY!",
  "Eight-time Mr. Olympia approved! That workout was FIRE!",
]

function speak(text, rate = 1, pitch = 1) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate
  u.pitch = pitch
  window.speechSynthesis.speak(u)
}

export function playWorkoutComplete() {
  const line = RONNIE_FINISH_LINES[Math.floor(Math.random() * RONNIE_FINISH_LINES.length)]
  speak(line, 0.82, 0.75)
}

export function playLunkAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      const start = ctx.currentTime + i * 0.55
      osc.frequency.setValueAtTime(220, start)
      osc.frequency.linearRampToValueAtTime(100, start + 0.45)
      gain.gain.setValueAtTime(0.0, start)
      gain.gain.linearRampToValueAtTime(0.7, start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5)
      osc.start(start)
      osc.stop(start + 0.55)
    }
  } catch {}
}
