const RONNIE_LINES = [
  "Yeah buddy!",
  "Lightweight baby!",
  "Ain't nothin' but a peanut!",
  "Everybody wanna be a bodybuilder but don't nobody wanna lift no heavy-ass weights!",
  "Light weight!",
  "That's what I'm talkin' about!",
  "Another one bites the dust!",
  "Come on!",
  "I'm doing this for the love of the sport!",
  "This is basic stuff!",
  "Do it!",
  "You got it!",
  "That's all you!",
  "Unbelievable!",
  "I love this stuff!",
]

const ARNOLD_LINES = [
  "Get to the chopper!",
  "I'll be back.",
  "It's not a tumor!",
  "The mind is the limit.",
  "Milk is for babies. When you grow up you have to drink beer.",
  "Strength does not come from winning. Your struggles develop your strengths.",
  "You can have results or excuses, not both.",
  "The worst thing I can be is the same as everybody else.",
  "Just remember, you can't climb the ladder of success with your hands in your pockets.",
]

function speak(text, rate = 1, pitch = 1) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate
  u.pitch = pitch
  window.speechSynthesis.speak(u)
}

export function playSetCompleteVoice() {
  if (Math.random() < 0.5) {
    const line = RONNIE_LINES[Math.floor(Math.random() * RONNIE_LINES.length)]
    speak(line, 0.85, 0.85)
  } else {
    const line = ARNOLD_LINES[Math.floor(Math.random() * ARNOLD_LINES.length)]
    speak(line, 1.0, 1.0)
  }
}

export function playWorkoutComplete() {
  speak('YEAH BUDDY, LIGHTWEIGHT BABY!', 0.85, 0.85)
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
