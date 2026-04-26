import type { Session } from '../../types'
import Button from '../ui/Button'

function formatDuration(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(Math.floor(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

interface SessionDoneScreenProps {
  session: Session
  onRestart: () => void
  onEnd: () => void
}

export default function SessionDoneScreen({ session, onRestart, onEnd }: SessionDoneScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">모든 질문을 완료했습니다!</h2>
          <p className="text-sm text-gray-500 mt-2">
            총 {session.askedIds.length}개 질문 · {session.questions.length}개 문제 세트
          </p>
        </div>

        {session.recordings.length > 0 && (
          <div className="text-left bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">녹음 목록</p>
            {session.recordings.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 truncate flex-1">{r.questionText}</span>
                <span className="text-gray-400 font-mono shrink-0">{formatDuration(r.duration)}</span>
                <audio controls src={r.blobURL} className="h-6 w-32 shrink-0" />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onEnd}>면접 종료</Button>
          <Button onClick={onRestart}>
            다시 시작
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
