import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useInterviewStore from '../store/useInterviewStore'
import useTimer from './useTimer'

export default function useSession() {
  const navigate = useNavigate()
  const { session, nextQuestion, restartSession, endSession } = useInterviewStore()
  const timer = useTimer()
  const [showAnswer, setShowAnswer] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const handleNext = useCallback(() => {
    nextQuestion()
    timer.reset()
    timer.start()
    setShowAnswer(false)
    setRecorderKey(k => k + 1)
  }, [nextQuestion, timer])

  const handleRestart = useCallback(() => {
    restartSession()
    timer.reset()
    timer.start()
    setShowAnswer(false)
    setRecorderKey(k => k + 1)
  }, [restartSession, timer])

  const handleEnd = useCallback(() => {
    timer.stop()
    endSession()
    navigate('/')
  }, [timer, endSession, navigate])

  return {
    session,
    timer,
    showAnswer,
    setShowAnswer,
    recorderKey,
    confirmEnd,
    setConfirmEnd,
    handleNext,
    handleRestart,
    handleEnd,
  }
}
