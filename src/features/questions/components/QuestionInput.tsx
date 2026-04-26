import { useState } from 'react'
import useInterviewStore from '../../../store/useInterviewStore'
import Button from '../../../shared/components/Button'

export default function QuestionInput() {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('일반')
  const [error, setError] = useState('')
  const { addQuestion, categories } = useInterviewStore()

  const handleAdd = () => {
    if (!text.trim()) { setError('질문 내용을 입력해주세요.'); return }
    if (!addQuestion(text, category)) { setError('이미 동일한 질문이 존재합니다.'); return }
    setText('')
    setError('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-32"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          placeholder="질문을 입력하고 Enter 또는 추가 버튼을 누르세요"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button onClick={handleAdd}>추가</Button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
