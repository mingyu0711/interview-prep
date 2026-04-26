import type { StateCreator } from 'zustand'
import type { Question } from '../types'

export interface QuestionSlice {
  questions: Question[]
  addQuestion: (text: string, category?: string) => boolean
  addQuestions: (items: { text: string; category?: string }[]) => number
  removeQuestion: (id: number) => void
  updateQuestion: (id: number, text: string, category: string) => void
  clearQuestions: () => void
}

export const createQuestionSlice: StateCreator<QuestionSlice> = (set, get) => ({
  questions: [],

  addQuestion: (text, category = '일반') => {
    const trimmed = text.trim()
    if (!trimmed) return false
    if (get().questions.some(q => q.text === trimmed)) return false
    set(state => ({
      questions: [...state.questions, { id: Date.now(), text: trimmed, category }],
    }))
    return true
  },

  addQuestions: (items) => {
    const existing = new Set(get().questions.map(q => q.text))
    const newOnes: Question[] = items
      .map(({ text, category }) => ({ text: text.trim(), category: category ?? '일반' }))
      .filter(({ text }) => text && !existing.has(text))
      .map(({ text, category }) => ({ id: Date.now() + Math.random(), text, category }))
    if (newOnes.length === 0) return 0
    set(state => ({ questions: [...state.questions, ...newOnes] }))
    return newOnes.length
  },

  removeQuestion: (id) =>
    set(state => ({ questions: state.questions.filter(q => q.id !== id) })),

  updateQuestion: (id, text, category) =>
    set(state => ({
      questions: state.questions.map(q => q.id === id ? { ...q, text, category } : q),
    })),

  clearQuestions: () => set({ questions: [] }),
})
