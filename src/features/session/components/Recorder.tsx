import { useState } from 'react'
import useRecorder from '../../../shared/hooks/useRecorder'
import useInterviewStore from '../../../store/useInterviewStore'
import Button from '../../../shared/components/Button'

function formatDuration(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(Math.floor(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

interface RecorderProps {
  questionText: string
  questionIndex: number
}

export default function Recorder({ questionText, questionIndex }: RecorderProps) {
  const { status, audioURL, duration, start, pause, resume, stop, saveFile } = useRecorder()
  const { addRecording } = useInterviewStore()
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const snippet = questionText.slice(0, 30).replace(/[^가-힣a-zA-Z0-9]/g, '_')
    const fileName = `interview_q${questionIndex + 1}_${snippet}.webm`
    await saveFile(fileName)
    addRecording({ questionText, fileName, duration, blobURL: audioURL! })
    setSaved(true)
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
          {status === 'paused' && <span className="text-amber-500 text-sm">일시정지</span>}
          {(status === 'recording' || status === 'paused') && (
            <span className="font-mono text-sm text-gray-600">{formatDuration(duration)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {status === 'idle' && (
          <Button onClick={start} variant="danger">
            <span className="w-2 h-2 rounded-full bg-white" />
            녹음 시작
          </Button>
        )}
        {status === 'recording' && (
          <>
            <Button onClick={pause} variant="warning">일시정지</Button>
            <Button onClick={stop} variant="secondary">중지</Button>
          </>
        )}
        {status === 'paused' && (
          <>
            <Button onClick={resume} variant="danger">재개</Button>
            <Button onClick={stop} variant="secondary">중지</Button>
          </>
        )}
        {status === 'stopped' && (
          <>
            <Button onClick={start} variant="danger">다시 녹음</Button>
            <Button onClick={handleSave} variant="success" disabled={saved}>
              {saved ? '저장됨' : '파일 저장'}
            </Button>
          </>
        )}
      </div>

      {audioURL && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">녹음 재생 ({formatDuration(duration)})</p>
          <audio controls src={audioURL} className="w-full h-9" />
        </div>
      )}

      <p className="text-xs text-gray-400">
        단축키: <kbd className="bg-white border border-gray-200 rounded px-1">Space</kbd> 녹음 토글
      </p>
    </div>
  )
}
