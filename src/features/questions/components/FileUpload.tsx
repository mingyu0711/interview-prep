import { useRef, useState } from 'react'
import useInterviewStore from '../../../store/useInterviewStore'
import Button from '../../../shared/components/Button'

export default function FileUpload() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<{ total: number; added: number } | null>(null)
  const { addQuestions, categories } = useInterviewStore()
  const [defaultCategory, setDefaultCategory] = useState('일반')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result
      if (typeof content !== 'string') return
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
      const items = lines.map(line => {
        const sep = line.indexOf('::')
        if (sep !== -1) return { category: line.slice(0, sep).trim(), text: line.slice(sep + 2).trim() }
        return { category: defaultCategory, text: line }
      })
      setResult({ total: lines.length, added: addQuestions(items) })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={defaultCategory}
          onChange={e => setDefaultCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-32"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          텍스트 파일 업로드
        </Button>
        <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
        <p className="text-xs text-gray-400">
          한 줄에 하나 또는 <code className="bg-gray-100 px-1 rounded">카테고리::질문</code> 형식
        </p>
      </div>
      {result && (
        <p className="text-sm text-emerald-600">
          {result.total}개 중 {result.added}개 추가됨
          {result.total - result.added > 0 && ` (${result.total - result.added}개 중복 제외)`}
        </p>
      )}
    </div>
  )
}
