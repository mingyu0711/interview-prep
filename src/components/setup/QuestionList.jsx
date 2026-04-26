import { useState } from 'react'
import useInterviewStore from '../../store/useInterviewStore'
import Button from '../ui/Button'

const CATEGORY_COLORS = {
  '일반': 'bg-gray-100 text-gray-700',
  '프론트엔드': 'bg-blue-100 text-blue-700',
  '백엔드': 'bg-purple-100 text-purple-700',
  'CS/자료구조': 'bg-amber-100 text-amber-700',
  '알고리즘': 'bg-green-100 text-green-700',
  '행동면접': 'bg-pink-100 text-pink-700',
}

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'
}

export default function QuestionList({ filterCategory }) {
  const { questions, removeQuestion, updateQuestion, categories, clearQuestions } = useInterviewStore()
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editCat, setEditCat] = useState('')

  const filtered = filterCategory
    ? questions.filter(q => q.category === filterCategory)
    : questions

  const startEdit = (q) => {
    setEditingId(q.id)
    setEditText(q.text)
    setEditCat(q.category)
  }

  const saveEdit = (id) => {
    if (editText.trim()) updateQuestion(id, editText.trim(), editCat)
    setEditingId(null)
  }

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
        <p className="text-sm text-gray-500">총 {filtered.length}개 {filterCategory && `(${filterCategory})`}</p>
        {questions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (confirm('모든 질문을 삭제할까요?')) clearQuestions() }}
            className="text-red-500 hover:bg-red-50"
          >
            전체 삭제
          </Button>
        )}
      </div>
      {filtered.map((q, idx) => (
        <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30 group transition-colors">
          <span className="text-xs text-gray-400 mt-0.5 w-6 shrink-0 text-right">{idx + 1}</span>
          {editingId === q.id ? (
            <div className="flex-1 space-y-2">
              <select
                value={editCat}
                onChange={e => setEditCat(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                autoFocus
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit(q.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit(q.id)}>저장</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>취소</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${categoryColor(q.category)}`}>
                  {q.category}
                </span>
                <p className="text-sm text-gray-800 break-words">{q.text}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => startEdit(q)} className="p-1 rounded hover:bg-white text-gray-400 hover:text-indigo-500" title="편집">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => removeQuestion(q.id)} className="p-1 rounded hover:bg-white text-gray-400 hover:text-red-500" title="삭제">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
