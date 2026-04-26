import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useInterviewStore from '../store/useInterviewStore'
import useTimer from '../hooks/useTimer'
import Recorder from '../components/session/Recorder'
import Button from '../components/ui/Button'

function formatDuration(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(Math.floor(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

export default function SessionPage() {
  const navigate = useNavigate()
  const { session, nextQuestion, endSession } = useInterviewStore()
  const { formatted, start: startTimer, reset: resetTimer } = useTimer()
  const [showAnswer, setShowAnswer] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)

  useEffect(() => {
    if (!session) {
      navigate('/')
      return
    }
    startTimer()
  }, [])

  const currentQuestion = session?.questions[session.currentIndex]
  const totalAsked = session?.askedIds.length ?? 0
  const totalQuestions = session?.questions.length ?? 0
  const progress = totalQuestions > 0 ? (session!.currentIndex / totalQuestions) * 100 : 0

  const handleNext = useCallback(() => {
    nextQuestion()
    resetTimer()
    startTimer()
    setShowAnswer(false)
    setRecorderKey(k => k + 1)
  }, [nextQuestion, resetTimer, startTimer])

  const handleEnd = () => {
    if (confirm('면접을 종료하시겠습니까?')) {
      endSession()
      navigate('/')
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'n') handleNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNext])

  if (!session || !currentQuestion) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-gray-900">면접 진행 중</h1>
            {session.filterCategory && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                {session.filterCategory}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono">{formatted}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleEnd} className="text-red-500 hover:bg-red-50">
              종료
            </Button>
          </div>
        </div>
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>질문 {session.currentIndex + 1} / {totalQuestions}</span>
          <span>총 {totalAsked}개 질문 받음</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="mb-4">
            <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
              {currentQuestion.category}
            </span>
          </div>
          <p className="text-2xl font-medium text-gray-900 leading-relaxed">
            {currentQuestion.text}
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAnswer
                  ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                } />
              </svg>
              {showAnswer ? '답변 힌트 숨기기' : '답변 힌트 보기'}
            </button>
            <span className="text-xs text-gray-400 font-mono">경과 {formatted}</span>
          </div>

          {showAnswer && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-800 font-medium mb-1">답변 메모</p>
              <textarea
                placeholder="답변 키워드나 포인트를 적어보세요..."
                className="w-full text-sm text-gray-700 bg-transparent resize-none focus:outline-none placeholder-indigo-300 min-h-20"
              />
            </div>
          )}
        </div>

        <Recorder key={recorderKey} questionText={currentQuestion.text} questionIndex={session.currentIndex} />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={handleEnd}>면접 종료</Button>
          <Button onClick={handleNext}>
            다음 질문
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {session.recordings.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">이번 세션 녹음 목록</h3>
            <ul className="space-y-2">
              {session.recordings.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-4">{r.questionText}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400 font-mono">{formatDuration(r.duration)}</span>
                    <audio controls src={r.blobURL} className="h-7 w-40" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-center text-xs text-gray-400">
          단축키: <kbd className="bg-white border border-gray-200 rounded px-1">→</kbd> 또는 <kbd className="bg-white border border-gray-200 rounded px-1">N</kbd> 다음 질문
        </p>
      </main>
    </div>
  )
}
