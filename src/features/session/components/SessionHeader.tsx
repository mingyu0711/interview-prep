import type { Session } from '../../../types'
import Button from '../../../shared/components/Button'
import CategoryPill from '../../../shared/components/CategoryPill'

interface SessionHeaderProps {
  session: Session
  formatted: string
  progress: number
  onEndRequest: () => void
}

export default function SessionHeader({ session, formatted, progress, onEndRequest }: SessionHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">면접 진행 중</h1>
          {session.filterCategory && <CategoryPill category={session.filterCategory} />}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-gray-500 font-mono">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatted}
          </span>
          <Button variant="ghost" size="sm" onClick={onEndRequest} className="text-red-500 hover:bg-red-50">
            종료
          </Button>
        </div>
      </div>
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </header>
  )
}
