import { useState } from 'react'
import useCategoryStore from '../../../store/useCategoryStore'
import type { Question } from '../../../types'
import CategoryPill from '../../../shared/components/CategoryPill'
import CategoryInput from './CategoryInput'

interface CategoryFilterProps {
  questions: readonly Question[]
  selected: string
  onChange: (category: string) => void
}

export default function CategoryFilter({ questions, selected, onChange }: CategoryFilterProps) {
  const categories = useCategoryStore(state => state.categories)
  const [showInput, setShowInput] = useState(false)

  const counts = new Map<string, number>()
  for (const question of questions) {
    counts.set(question.category, (counts.get(question.category) ?? 0) + 1)
  }

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
            count={counts.get(cat) ?? 0}
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
