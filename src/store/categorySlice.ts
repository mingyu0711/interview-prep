import type { StateCreator } from 'zustand'
import { DEFAULT_CATEGORIES } from '../constants/categories'

export interface CategorySlice {
  categories: string[]
  addCategory: (name: string) => void
}

export const createCategorySlice: StateCreator<CategorySlice> = (set, get) => ({
  categories: [...DEFAULT_CATEGORIES],

  addCategory: (name) => {
    const trimmed = name.trim()
    if (!trimmed || get().categories.includes(trimmed)) return
    set(state => ({ categories: [...state.categories, trimmed] }))
  },
})
