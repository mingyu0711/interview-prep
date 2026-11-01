import { useId, useRef, useState } from 'react'
import useCategoryStore from '../../../store/useCategoryStore'
import { useUpdateQuestion } from '../hooks/useQuestions'
import { validateQuestion, type Question } from '../model/question'
import { ApiError } from '../../../shared/api/http'
import { requestMessage } from '../hooks/requestMessage'
import Button from '../../../shared/components/Button'
import { questionMessages } from './questionMessages'

interface QuestionEditFormProps {
  questions: readonly Question[]
  id: number
  initialText: string
  initialCategory: string
  onDone: () => void
  disabled?: boolean
}

export default function QuestionEditForm({ questions, id, initialText, initialCategory, onDone, disabled = false }: QuestionEditFormProps) {
  const [text, setText] = useState(initialText)
  const [category, setCategory] = useState(initialCategory)
  const [error, setError] = useState('')
  const errorId = useId()
  const mutation = useUpdateQuestion()
  const submitting = useRef(false)
  const [deleted, setDeleted] = useState(false)
  const categories = useCategoryStore(state => state.categories)
  const options = categories.includes(initialCategory) ? categories : [...categories, initialCategory]

  const locked = disabled || mutation.isPending

  const save = async () => {
    if (submitting.current || disabled || deleted) return
    const result = validateQuestion({ text, category }, questions, id)
    if (!result.success) {
      setError(result.reasons.map(reason => questionMessages[reason]).join(' '))
      return
    }
    submitting.current = true
    setError('')
    try {
      await mutation.mutateAsync({ id, input: result.data })
      onDone()
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setDeleted(true)
      setError(requestMessage(error))
    } finally {
      submitting.current = false
    }
  }

  return (
    <form className="flex-1 min-w-0 space-y-2" onSubmit={event => { event.preventDefault(); void save() }}>
      <select
        aria-label="편집 카테고리"
        disabled={locked || deleted}
        value={category}
        onChange={e => setCategory(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-xs"
      >
        {options.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        aria-label="편집할 질문"
        readOnly={deleted}
        disabled={locked}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        autoFocus
        value={text}
        onChange={e => { setText(e.target.value); if (!deleted) setError('') }}
        onKeyDown={e => { if (e.key === 'Escape' && !submitting.current) onDone() }}
        className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {error && <p id={errorId} role="alert" className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={locked || deleted}>{mutation.isPending ? '저장 중…' : '저장'}</Button>
        <Button type="button" size="sm" variant="ghost" disabled={locked} onClick={onDone}>취소</Button>
      </div>
    </form>
  )
}
