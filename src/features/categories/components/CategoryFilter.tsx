import { useState } from 'react'
import useInterviewStore from '../../../store/useInterviewStore'
import CategoryPill from '../../../shared/components/CategoryPill'
import CategoryInput from './CategoryInput'

interface CategoryFilterProps {
  selected: string
  onChange: (category: string) => void
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { questions, categories } = useInterviewStore()
  const [showInput, setShowInput] = useState(false)

  const counts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">카테고리</h2>
        <button onClick={() => setShowInput(v => !v)} className="text-xs text-indigo-600 hover:underline">
          + 카테고리 추가
        </button>
      </div>

      {showInput && <CategoryInput onClose={() => setShowInput(false)} />}

      <div className="flex flex-wrap gap-2">
        <CategoryPill
          category="전체"
          count={questions.length}
          selected={selected === ''}
          onClick={() => onChange('')}
        />
        {categories.map(cat => (
          <CategoryPill
            key={cat}
            category={cat}
            count={counts[cat] ?? 0}
            selected={selected === cat}
            onClick={() => onChange(selected === cat ? '' : cat)}
          />
        ))}
      </div>

      {selected && (
        <p className="mt-3 text-xs text-indigo-600">"{selected}" 카테고리로만 면접을 시작합니다.</p>
      )}
    </div>
  )
}
