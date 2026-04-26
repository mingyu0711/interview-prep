import { useState, useRef, useCallback } from 'react'

export default function useTimer() {
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef(null)
  const rafRef = useRef(null)

  const tick = useCallback(() => {
    setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    startedAtRef.current = Date.now()
    setElapsed(0)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const reset = useCallback(() => {
    stop()
    setElapsed(0)
  }, [stop])

  const format = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return { elapsed, formatted: format(elapsed), start, stop, reset }
}
