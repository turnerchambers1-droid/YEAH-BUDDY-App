const RONNIE_REST_POSITIVE = [
  "YEAH BUDDY! REST IS OVER! Get back under that bar!",
  "Lightweight baby! Time to LIFT!",
  "Ain't nothin' but a peanut! Let's GO again!",
  "That's what I'm talkin' about! Now get back to WORK!",
  "Unbelievable rest — now show me an UNBELIEVABLE set!",
  "YEAH BUDDY! The bar's been waiting. Don't keep it waiting!",
  "Rest complete! Now go earn those GAINS!",
  "Beautiful recovery! Now let's make it UGLY under the bar!",
]

const RONNIE_REST_NEGATIVE = [
  "That's it? That's ALL the rest you need? Back to work, WEAKLING!",
  "Stop napping! You're not at a spa — you're in a GYM!",
  "You resting or just SCARED of the weight? LET'S GO!",
  "Soft! You going soft on me? The bar's waiting, champ!",
  "Eight-time Mr. Olympia didn't sit around. GET. UP. NOW.",
  "You call that a rest? Get UP. The weights aren't gonna lift themselves!",
  "Stop babysitting yourself. Bar. Now. MOVE!",
  "I've seen grandmas move faster. Let's GO!",
]

const RONNIE_FINISH_POSITIVE = [
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

const RONNIE_FINISH_NEGATIVE = [
  "Finally done. Honestly thought you might quit halfway. You didn't. Barely.",
  "That workout was... acceptable. Next time push harder.",
  "You finished. Want a medal? Come back tomorrow and actually TRY.",
  "Done. Could've been better. You know it, I know it. See you tomorrow.",
  "Well. You showed up. That's the bare minimum. Do better next session.",
]

function speak(text, rate = 1, pitch = 1) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate
  u.pitch = pitch
  window.speechSynthesis.speak(u)
}

export function playRestComplete(negative = false) {
  const lines = negative ? RONNIE_REST_NEGATIVE : RONNIE_REST_POSITIVE
  const line = lines[Math.floor(Math.random() * lines.length)]
  speak(line, 0.85, 0.72)
}

export function playWorkoutComplete(negative = false) {
  const lines = negative ? RONNIE_FINISH_NEGATIVE : RONNIE_FINISH_POSITIVE
  const line = lines[Math.floor(Math.random() * lines.length)]
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
