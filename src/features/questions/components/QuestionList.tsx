import { useRef, useState } from 'react'
import type { Question } from '../../../types'
import Button from '../../../shared/components/Button'
import QuestionItem from './QuestionItem'
import QuestionEditForm from './QuestionEditForm'
import { useDeleteAllQuestions } from '../hooks/useQuestions'
import { requestMessage } from '../hooks/requestMessage'

interface QuestionListProps {
  questions: readonly Question[]
  filterCategory: string | null
  clearing: boolean
  writePending: boolean
}

export default function QuestionList({ questions, filterCategory, clearing, writePending }: QuestionListProps) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [error, setError] = useState('')
  // 필터 변경으로 질문 행이 제거돼도 삭제 결과 안내는 유지한다.
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({})
  const mutation = useDeleteAllQuestions()
  const submitting = useRef(false)
  const filtered = filterCategory ? questions.filter(q => q.category === filterCategory) : questions
  const updateDeleteError = (id: number, message: string) => {
    setDeleteErrors(previous => {
      const next = { ...previous }
      if (message) next[id] = message
      else delete next[id]
      return next
    })
  }
  const clear = async () => {
    if (submitting.current || writePending) return
    submitting.current = true
    setError('')
    try {
      await mutation.mutateAsync()
      setConfirmClear(false)
      setDeleteErrors({})
    } catch (error) {
      setError(requestMessage(error))
    } finally {
      submitting.current = false
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">총 {filtered.length}개{filterCategory && ` (${filterCategory})`}</p>
        {questions.length > 0 && <Button variant="ghost" size="sm" disabled={writePending} onClick={() => { setConfirmClear(true); setError('') }} className="text-red-500">전체 삭제</Button>}
      </div>
      {confirmClear && <div role="group" aria-label="전체 삭제 확인" className="p-3 rounded border border-red-200 space-y-2">
        <p className="text-sm">필터와 관계없이 전체 질문 {questions.length}개를 삭제할까요?</p>
        <div className="flex gap-2">
          <Button size="sm" variant="danger" disabled={writePending} onClick={() => void clear()}>{mutation.isPending ? '삭제 중…' : '삭제 확인'}</Button>
          <Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={() => { setConfirmClear(false); setError('') }}>취소</Button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>}
      {editing && <div className="p-3 border border-indigo-300 rounded-lg">
        <h3 className="text-sm font-medium mb-2">질문 편집</h3>
        <QuestionEditForm disabled={clearing} key={editing.id} questions={questions} id={editing.id} initialText={editing.text} initialCategory={editing.category} onDone={() => setEditing(null)} />
      </div>}
      {questions.length === 0
        ? <p className="text-center py-8 text-sm text-gray-500">아직 질문이 없습니다. 위에서 질문을 추가해보세요.</p>
        : filtered.length === 0 && <p className="text-center py-8 text-sm text-gray-500">이 카테고리에는 질문이 없습니다.</p>}
      {filtered.map((question, index) => <QuestionItem
        disabled={clearing}
        key={question.id}
        question={question}
        index={index}
        editing={editing !== null}
        onEdit={() => setEditing({ ...question })}
        deleteError={deleteErrors[question.id] ?? ''}
        onDeleteError={message => updateDeleteError(question.id, message)}
      />)}
    </div>
  )
}
