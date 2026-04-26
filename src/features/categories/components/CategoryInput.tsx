import { useState } from 'react'
import useInterviewStore from '../../../store/useInterviewStore'
import Button from '../../../shared/components/Button'

interface CategoryInputProps {
  onClose: () => void
}

export default function CategoryInput({ onClose }: CategoryInputProps) {
  const [name, setName] = useState('')
  const { addCategory } = useInterviewStore()

  const handleAdd = () => {
    if (!name.trim()) return
    addCategory(name.trim())
    setName('')
    onClose()
  }

  return (
    <div className="flex gap-2 mb-4">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        placeholder="새 카테고리 이름"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <Button size="sm" onClick={handleAdd}>추가</Button>
      <Button size="sm" variant="ghost" onClick={onClose}>취소</Button>
    </div>
  )
}
