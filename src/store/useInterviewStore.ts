import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createQuestionSlice, type QuestionSlice } from './questionSlice'
import { createCategorySlice, type CategorySlice } from './categorySlice'
import { createSessionSlice, type SessionSlice } from './sessionSlice'

type StoreState = QuestionSlice & CategorySlice & SessionSlice

const useInterviewStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createQuestionSlice(...a),
      ...createCategorySlice(...a),
      ...createSessionSlice(...a),
    }),
    {
      name: 'interview-prep-store',
      partialize: (state) => ({
        questions: state.questions,
        categories: state.categories,
      }),
    },
  ),
)

export default useInterviewStore
