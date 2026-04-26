import { useState } from 'react'

export default function QuestionHint() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open
            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          } />
        </svg>
        {open ? '답변 힌트 숨기기' : '답변 힌트 보기'}
      </button>

      {open && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-800 font-medium mb-1">답변 메모</p>
          <textarea
            placeholder="답변 키워드나 포인트를 적어보세요..."
            className="w-full text-sm text-gray-700 bg-transparent resize-none focus:outline-none placeholder-indigo-300 min-h-20"
          />
        </div>
      )}
    </div>
  )
}
