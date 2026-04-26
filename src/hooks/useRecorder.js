import { useState, useRef, useCallback } from 'react'

export default function useRecorder() {
  const [status, setStatus] = useState('idle') // idle | recording | paused | stopped
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const pausedDurationRef = useRef(0)

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current * 1000
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      setDuration(elapsed)
    }, 100)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    if (status === 'recording') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      pausedDurationRef.current = 0

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioURL(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }

      mr.start(100)
      mediaRecorderRef.current = mr
      setStatus('recording')
      setAudioURL(null)
      setAudioBlob(null)
      startTimer()
    } catch (err) {
      console.error('마이크 접근 오류:', err)
      alert('마이크 접근 권한이 필요합니다.')
    }
  }, [status, startTimer])

  const pause = useCallback(() => {
    if (status !== 'recording') return
    mediaRecorderRef.current?.pause()
    stopTimer()
    pausedDurationRef.current = duration
    setStatus('paused')
  }, [status, stopTimer, duration])

  const resume = useCallback(() => {
    if (status !== 'paused') return
    mediaRecorderRef.current?.resume()
    setStatus('recording')
    startTimer()
  }, [status, startTimer])

  const stop = useCallback(() => {
    if (status === 'idle') return
    stopTimer()
    mediaRecorderRef.current?.stop()
    setStatus('stopped')
  }, [status, stopTimer])

  const reset = useCallback(() => {
    stop()
    setStatus('idle')
    setAudioURL(null)
    setAudioBlob(null)
    setDuration(0)
    pausedDurationRef.current = 0
    chunksRef.current = []
  }, [stop])

  const saveFile = useCallback(async (suggestedName = 'recording.webm') => {
    if (!audioBlob) return
    try {
      // File System Access API — allows user to pick save path
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: 'Audio', accept: { 'audio/webm': ['.webm'] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(audioBlob)
        await writable.close()
      } else {
        // Fallback: download
        const a = document.createElement('a')
        a.href = audioURL
        a.download = suggestedName
        a.click()
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('저장 오류:', err)
    }
  }, [audioBlob, audioURL])

  return { status, audioURL, audioBlob, duration, start, pause, resume, stop, reset, saveFile }
}
