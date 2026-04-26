import { getCategoryColor } from '../../constants/categories'

interface CategoryPillProps {
  category: string
  selected?: boolean
  count?: number
  onClick?: () => void
}

export default function CategoryPill({ category, selected = false, count, onClick }: CategoryPillProps) {
  const base = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors'
  const style = selected
    ? 'bg-indigo-600 text-white'
    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'

  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} ${style}`}>
        {category}{count !== undefined && ` (${count})`}
      </button>
    )
  }

  return (
    <span className={`${base} ${getCategoryColor(category)}`}>
      {category}
    </span>
  )
}
