import { useState } from 'react'
import useInterviewStore from '../../../store/useInterviewStore'
import Button from '../../../shared/components/Button'
import ConfirmToast from '../../../shared/components/Toast'
import QuestionItem from './QuestionItem'

interface QuestionListProps {
  filterCategory: string | null
}

export default function QuestionList({ filterCategory }: QuestionListProps) {
  const { questions, clearQuestions } = useInterviewStore()
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = filterCategory ? questions.filter(q => q.category === filterCategory) : questions

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">📝</p>
        <p>아직 질문이 없습니다. 위에서 질문을 추가해보세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          총 {filtered.length}개{filterCategory && ` (${filterCategory})`}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} className="text-red-500 hover:bg-red-50">
          전체 삭제
        </Button>
      </div>

      {filtered.map((q, idx) => (
        <QuestionItem key={q.id} question={q} index={idx} />
      ))}

      {confirmClear && (
        <ConfirmToast
          message="모든 질문을 삭제할까요?"
          type="danger"
          onConfirm={() => { clearQuestions(); setConfirmClear(false) }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  )
}
