import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useInterviewStore from '../store/useInterviewStore'

export default function useSetup() {
  const navigate = useNavigate()
  const { questions, categories, startSession, addCategory } = useInterviewStore()
  const [filterCat, setFilterCat] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [showCatInput, setShowCatInput] = useState(false)

  const categoryCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] ?? 0) + 1
    return acc
  }, {})

  const handleStart = () => {
    const ok = startSession(filterCat || null)
    if (ok) navigate('/session')
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    addCategory(newCatName.trim())
    setNewCatName('')
    setShowCatInput(false)
  }

  const toggleCategory = (cat: string) => {
    setFilterCat(prev => (prev === cat ? '' : cat))
  }

  return {
    questions,
    categories,
    filterCat,
    newCatName,
    setNewCatName,
    showCatInput,
    setShowCatInput,
    categoryCounts,
    handleStart,
    handleAddCategory,
    toggleCategory,
  }
}
