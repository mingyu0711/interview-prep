import { useState, useRef, useCallback } from 'react'

interface UseTimerReturn {
  elapsed: number
  formatted: string
  start: () => void
  stop: () => void
  reset: () => void
}

function format(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function useTimer(): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

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
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
  }, [])

  const reset = useCallback(() => {
    stop()
    setElapsed(0)
  }, [stop])

  return { elapsed, formatted: format(elapsed), start, stop, reset }
}
