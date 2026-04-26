import type { Question } from '../../../types'
import Badge from '../../../shared/components/Badge'
import { getCategoryColor } from '../../../constants/categories'
import QuestionHint from './QuestionHint'

interface QuestionCardProps {
  question: Question
  currentIndex: number
  totalQuestions: number
  totalAsked: number
  formatted: string
}

export default function QuestionCard({ question, currentIndex, totalQuestions, totalAsked, formatted }: QuestionCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>질문 {currentIndex + 1} / {totalQuestions}</span>
        <span>총 {totalAsked}개 받음</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-4">
          <Badge label={question.category} className={getCategoryColor(question.category)} />
        </div>
        <p className="text-2xl font-medium text-gray-900 leading-relaxed">{question.text}</p>

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
          <QuestionHint />
          <span className="text-xs text-gray-400 font-mono">경과 {formatted}</span>
        </div>
      </div>
    </div>
  )
}
