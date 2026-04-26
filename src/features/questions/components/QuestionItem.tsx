import { useState } from 'react'
import type { Question } from '../../../types'
import useInterviewStore from '../../../store/useInterviewStore'
import Badge from '../../../shared/components/Badge'
import { getCategoryColor } from '../../../constants/categories'
import QuestionEditForm from './QuestionEditForm'

interface QuestionItemProps {
  question: Question
  index: number
}

export default function QuestionItem({ question, index }: QuestionItemProps) {
  const [editing, setEditing] = useState(false)
  const { removeQuestion } = useInterviewStore()

  if (editing) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg border border-indigo-300 bg-indigo-50/30">
        <span className="text-xs text-gray-400 mt-0.5 w-6 shrink-0 text-right">{index + 1}</span>
        <QuestionEditForm
          id={question.id}
          initialText={question.text}
          initialCategory={question.category}
          onDone={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30 group transition-colors">
      <span className="text-xs text-gray-400 mt-0.5 w-6 shrink-0 text-right">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <Badge label={question.category} className={`mb-1 ${getCategoryColor(question.category)}`} />
        <p className="text-sm text-gray-800 break-words">{question.text}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-white text-gray-400 hover:text-indigo-500" title="편집">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => removeQuestion(question.id)} className="p-1 rounded hover:bg-white text-gray-400 hover:text-red-500" title="삭제">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
