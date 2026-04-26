import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useInterviewStore from '../store/useInterviewStore'
import Button from '../shared/components/Button'
import QuestionInput from '../features/questions/components/QuestionInput'
import FileUpload from '../features/questions/components/FileUpload'
import QuestionList from '../features/questions/components/QuestionList'
import CategoryFilter from '../features/categories/components/CategoryFilter'

export default function SetupPage() {
  const navigate = useNavigate()
  const { questions, startSession } = useInterviewStore()
  const [filterCat, setFilterCat] = useState('')

  const handleStart = () => {
    if (startSession(filterCat || null)) navigate('/session')
  }

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
          <CategoryFilter selected={filterCat} onChange={setFilterCat} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">질문 목록</h2>
          <QuestionList filterCategory={filterCat || null} />
        </section>
      </main>
    </div>
  )
}
