import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useInterviewStore from '../store/useInterviewStore'
import QuestionInput from '../components/setup/QuestionInput'
import FileUpload from '../components/setup/FileUpload'
import QuestionList from '../components/setup/QuestionList'
import Button from '../components/ui/Button'

export default function SetupPage() {
  const navigate = useNavigate()
  const { questions, categories, startSession, addCategory } = useInterviewStore()
  const [filterCat, setFilterCat] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [showCatInput, setShowCatInput] = useState(false)

  const handleStart = () => {
    const ok = startSession(filterCat || null)
    if (ok) navigate('/session')
    else alert('선택한 카테고리에 질문이 없습니다.')
  }

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim())
      setNewCatName('')
      setShowCatInput(false)
    }
  }

  const categoryCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">면접 연습</h1>
            <p className="text-xs text-gray-500 mt-0.5">질문을 설정하고 면접을 시작하세요</p>
          </div>
          <Button size="lg" onClick={handleStart} disabled={questions.length === 0} className="shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            면접 시작
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">질문 추가</h2>
          <QuestionInput />
          <div className="border-t border-gray-100 pt-4">
            <FileUpload />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">카테고리</h2>
            <button
              onClick={() => setShowCatInput(!showCatInput)}
              className="text-xs text-indigo-600 hover:underline"
            >
              + 카테고리 추가
            </button>
          </div>

          {showCatInput && (
            <div className="flex gap-2 mb-4">
              <input
                autoFocus
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
                placeholder="새 카테고리 이름"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button size="sm" onClick={handleAddCategory}>추가</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCatInput(false)}>취소</Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCat('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterCat === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 ({questions.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat} ({categoryCounts[cat] ?? 0})
              </button>
            ))}
          </div>

          {filterCat && (
            <p className="mt-3 text-xs text-indigo-600">
              "{filterCat}" 카테고리로만 면접을 시작합니다.
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">질문 목록</h2>
          <QuestionList filterCategory={filterCat || null} />
        </section>
      </main>
    </div>
  )
}
