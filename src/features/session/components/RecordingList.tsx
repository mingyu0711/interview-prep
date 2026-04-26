import type { Recording } from '../../../types'

function formatDuration(secs: number): string {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(Math.floor(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

interface RecordingListProps {
  recordings: Recording[]
}

export default function RecordingList({ recordings }: RecordingListProps) {
  if (recordings.length === 0) return null

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">이번 세션 녹음 목록</h3>
      <ul className="space-y-2">
        {recordings.map((r, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className="text-gray-600 truncate flex-1">{r.questionText}</span>
            <span className="text-xs text-gray-400 font-mono shrink-0">{formatDuration(r.duration)}</span>
            <audio controls src={r.blobURL} className="h-7 w-40 shrink-0" />
          </li>
        ))}
      </ul>
    </section>
  )
}
