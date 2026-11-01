import { useId, useLayoutEffect, useRef, useState } from 'react'
import useCategoryStore from '../../../store/useCategoryStore'
import { useCreateQuestion } from '../hooks/useQuestions'
import { validateQuestion, type Question } from '../model/question'
import { requestMessage } from '../hooks/requestMessage'
import Button from '../../../shared/components/Button'
import { questionMessages } from './questionMessages'

export default function QuestionInput({ questions, disabled = false }: { questions: readonly Question[]; disabled?: boolean }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('일반')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const mutation = useCreateQuestion()
  const submitting = useRef(false)
  const categories = useCategoryStore(state => state.categories)
  const options = categories.includes(category) ? categories : [category, ...categories]
  const locked = disabled || mutation.isPending
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreFocus = useRef(false)

  useLayoutEffect(() => {
    if (locked || !restoreFocus.current) return
    restoreFocus.current = false
    // 요청 중 다른 요소로 이동했다면 사용자의 초점을 가져오지 않는다.
    if (document.activeElement === document.body) inputRef.current?.focus()
  }, [locked])

  const handleAdd = async () => {
    if (submitting.current || disabled) return
    setNotice('')
    const result = validateQuestion({ text, category }, questions)
    if (!result.success) {
      setError(result.reasons.map(reason => questionMessages[reason]).join(' '))
      return
    }
    restoreFocus.current = document.activeElement === inputRef.current
    submitting.current = true
    setError('')
    try {
      await mutation.mutateAsync(result.data)
      setText('')
      setNotice(`${category} 카테고리에 추가됨`)
    } catch (error) {
      setError(requestMessage(error))
    } finally {
      submitting.current = false
    }
  }

  return (
    <form className="space-y-2" onSubmit={event => { event.preventDefault(); void handleAdd() }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap">
        <select
          aria-label="질문 카테고리"
          disabled={locked}
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-32"
        >
          {options.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          ref={inputRef}
          aria-label="질문 내용"
          disabled={locked}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); setError('') }}
          placeholder="질문을 입력하고 Enter 또는 추가 버튼을 누르세요"
          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button type="submit" disabled={locked}>{mutation.isPending ? '추가 중…' : '추가'}</Button>
      </div>
      {notice && <p role="status" className="text-sm text-indigo-600">{notice}</p>}
      {error && <p id={errorId} role="alert" className="text-red-500 text-xs">{error}</p>}
    </form>
  )
}
