import { useState, useEffect, useRef } from 'react'

const gifCache = {}

export function useWgerGif(exerciseName) {
  const [gif, setGif] = useState(exerciseName ? (gifCache[exerciseName] ?? null) : null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!exerciseName) { setGif(null); return }
    if (gifCache[exerciseName] !== undefined) { setGif(gifCache[exerciseName]); return }
    const query = encodeURIComponent(exerciseName.split(' ').slice(0, 3).join(' '))
    fetch(`https://wger.de/api/v2/exercise/search/?term=${query}&language=english&format=json`)
      .then(r => r.json())
      .then(data => {
        const s = data?.suggestions?.[0]
        if (!s?.data?.id) { gifCache[exerciseName] = null; return null }
        return fetch(`https://wger.de/api/v2/exerciseimage/?exercise_base=${s.data.id}&format=json`)
      })
      .then(r => r?.json())
      .then(data => {
        const img = data?.results?.[0]?.image || null
        gifCache[exerciseName] = img
        if (mounted.current) setGif(img)
      })
      .catch(() => { gifCache[exerciseName] = null })
    return () => { mounted.current = false }
  }, [exerciseName])

  return gif
}
