import { useRef } from 'react'
import type { Question } from '../../../types'
import Badge from '../../../shared/components/Badge'
import Button from '../../../shared/components/Button'
import { getCategoryColor } from '../../../constants/categories'
import { useDeleteQuestion, useQuestionDeletePending } from '../hooks/useQuestions'
import { requestMessage } from '../hooks/requestMessage'

interface QuestionItemProps {
  question: Question
  index: number
  onEdit: () => void
  editing: boolean
  disabled: boolean
  deleteError: string
  onDeleteError: (message: string) => void
}

export default function QuestionItem({ question, index, onEdit, editing, disabled, deleteError, onDeleteError }: QuestionItemProps) {
  const mutation = useDeleteQuestion()
  const pending = useQuestionDeletePending(question.id)
  const locked = disabled || pending
  const submitting = useRef(false)
  const remove = async () => {
    if (submitting.current || locked) return
    submitting.current = true
    onDeleteError('')
    try {
      await mutation.mutateAsync(question.id)
    } catch (error) {
      onDeleteError(requestMessage(error))
    } finally {
      submitting.current = false
    }
  }

  return (
    <article aria-label={question.text} className="p-3 rounded-lg border border-gray-200 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-xs text-gray-400 mt-1 shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <Badge label={question.category} className={`mb-1 ${getCategoryColor(question.category)}`} />
          <p className="text-sm text-gray-800 break-words">{question.text}</p>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          <Button size="sm" variant="ghost" disabled={locked || editing} onClick={onEdit}>편집</Button>
          <Button size="sm" variant="ghost" disabled={locked} onClick={() => void remove()}>
            {pending ? '삭제 중…' : '삭제'}
          </Button>
        </div>
      </div>
      {deleteError && <p role="alert" className="text-xs text-red-600">{deleteError}</p>}
    </article>
  )
}
