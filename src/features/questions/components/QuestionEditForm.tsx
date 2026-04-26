import useInterviewStore from '../../../store/useInterviewStore'
import Button from '../../../shared/components/Button'

interface QuestionEditFormProps {
  id: number
  initialText: string
  initialCategory: string
  onDone: () => void
}

import { useState } from 'react'

export default function QuestionEditForm({ id, initialText, initialCategory, onDone }: QuestionEditFormProps) {
  const [text, setText] = useState(initialText)
  const [category, setCategory] = useState(initialCategory)
  const { updateQuestion, categories } = useInterviewStore()

  const save = () => {
    if (text.trim()) updateQuestion(id, text.trim(), category)
    onDone()
  }

  return (
    <div className="flex-1 space-y-2">
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-xs"
      >
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone() }}
        className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save}>저장</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>취소</Button>
      </div>
    </div>
  )
}
