import { useEffect, useState } from 'react'
import useRecorder from '../../hooks/useRecorder'
import useInterviewStore from '../../store/useInterviewStore'
import Button from '../ui/Button'

function formatDuration(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(Math.floor(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

export default function Recorder({ questionText, questionIndex }) {
  const { status, audioURL, audioBlob, duration, start, pause, resume, stop, reset, saveFile } = useRecorder()
  const { session, addRecording } = useInterviewStore()
  const [savedThisQuestion, setSavedThisQuestion] = useState(false)

  // Reset recorder when question changes
  useEffect(() => {
    reset()
    setSavedThisQuestion(false)
  }, [questionIndex])

  const handleSave = async () => {
    const questionSnippet = questionText.slice(0, 30).replace(/[^가-힣a-zA-Z0-9]/g, '_')
    const fileName = `interview_q${questionIndex + 1}_${questionSnippet}.webm`
    await saveFile(fileName)
    addRecording({ questionText, fileName, duration, blobURL: audioURL })
    setSavedThisQuestion(true)
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">답변 녹음</h3>
        <div className="flex items-center gap-2">
          {status === 'recording' && (
            <span className="flex items-center gap-1.5 text-red-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              녹음 중
            </span>
          )}
          {status === 'paused' && (
            <span className="text-amber-500 text-sm">일시정지</span>
          )}
          {(status === 'recording' || status === 'paused') && (
            <span className="font-mono text-sm text-gray-600">{formatDuration(duration)}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {status === 'idle' && (
          <Button onClick={start} variant="danger" size="md">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
            녹음 시작
          </Button>
        )}

        {status === 'recording' && (
          <>
            <Button onClick={pause} variant="warning" size="md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
              일시정지
            </Button>
            <Button onClick={stop} variant="secondary" size="md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" />
              </svg>
              중지
            </Button>
          </>
        )}

        {status === 'paused' && (
          <>
            <Button onClick={resume} variant="danger" size="md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              재개
            </Button>
            <Button onClick={stop} variant="secondary" size="md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" />
              </svg>
              중지
            </Button>
          </>
        )}

        {status === 'stopped' && (
          <>
            <Button onClick={start} variant="danger" size="md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" />
              </svg>
              다시 녹음
            </Button>
            <Button onClick={handleSave} variant="success" size="md" disabled={savedThisQuestion}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {savedThisQuestion ? '저장됨' : '파일 저장'}
            </Button>
          </>
        )}
      </div>

      {/* Audio Playback */}
      {audioURL && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">녹음 재생 ({formatDuration(duration)})</p>
          <audio controls src={audioURL} className="w-full h-9" />
        </div>
      )}

      {/* Keyboard hint */}
      <p className="text-xs text-gray-400">
        단축키: <kbd className="bg-white border border-gray-200 rounded px-1">Space</kbd> 녹음 토글
      </p>
    </div>
  )
}
