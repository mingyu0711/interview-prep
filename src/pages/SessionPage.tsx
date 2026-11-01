import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSession from '../hooks/useSession'
import Button from '../shared/components/Button'
import ConfirmToast from '../shared/components/Toast'
import SessionHeader from '../features/session/components/SessionHeader'
import QuestionCard from '../features/session/components/QuestionCard'
import Recorder from '../features/session/components/Recorder'
import RecordingList from '../features/session/components/RecordingList'
import SessionDoneScreen from '../features/session/components/SessionDoneScreen'

export default function SessionPage() {
  const navigate = useNavigate()
  const { session, timer, recorderKey, confirmEnd, setConfirmEnd, handleNext, handleRestart, handleEnd } = useSession()
  const hasSession = session !== null
  const { start, stop } = timer

  useEffect(() => {
    if (!hasSession) { navigate('/'); return }
    start()
    return stop
  }, [hasSession, navigate, start, stop])

  if (!session) return null
  if (session.isDone) return <SessionDoneScreen session={session} onRestart={handleRestart} onEnd={handleEnd} />

  const currentQuestion = session.questions[session.currentIndex]
  if (!currentQuestion) return null

  const progress = ((session.currentIndex + 1) / session.questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionHeader
        session={session}
        formatted={timer.formatted}
        progress={progress}
        onEndRequest={() => setConfirmEnd(true)}
      />

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <QuestionCard
          question={currentQuestion}
          currentIndex={session.currentIndex}
          totalQuestions={session.questions.length}
          totalAsked={session.askedIds.length}
          formatted={timer.formatted}
        />

        <Recorder key={recorderKey} questionText={currentQuestion.text} questionIndex={session.currentIndex} />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setConfirmEnd(true)}>면접 종료</Button>
          <Button onClick={handleNext}>
            다음 질문
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <RecordingList recordings={session.recordings} />

        <p className="text-center text-xs text-gray-400">
          단축키: <kbd className="bg-white border border-gray-200 rounded px-1">→</kbd> 또는 <kbd className="bg-white border border-gray-200 rounded px-1">N</kbd> 다음 질문
        </p>
      </main>

      {confirmEnd && (
        <ConfirmToast
          message="면접을 종료하시겠습니까?"
          type="danger"
          onConfirm={handleEnd}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </div>
  )
}
