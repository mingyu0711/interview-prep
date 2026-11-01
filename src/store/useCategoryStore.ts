import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import { DEFAULT_CATEGORIES } from '../constants/categories'
import { createCategorySlice, type CategorySlice } from './categorySlice'

const persistedCategories = z.object({ categories: z.array(z.string().trim().min(1)).min(1) })

const useCategoryStore = create<CategorySlice>()(persist(createCategorySlice, {
  name: 'interview-prep-categories-v1',
  version: 1,
  partialize: state => ({ categories: state.categories }),
  merge: (persisted, current) => {
    const parsed = persistedCategories.safeParse(persisted)
    return { ...current, categories: parsed.success ? [...new Set(parsed.data.categories)] : [...DEFAULT_CATEGORIES] }
  },
}))

export default useCategoryStore
