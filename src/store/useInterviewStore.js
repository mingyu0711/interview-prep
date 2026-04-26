import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useInterviewStore = create(
  persist(
    (set, get) => ({
      // --- Question Management ---
      questions: [],
      addQuestion: (text, category = '일반') => {
        const trimmed = text.trim()
        if (!trimmed) return false
        const isDuplicate = get().questions.some(q => q.text === trimmed)
        if (isDuplicate) return false
        set(state => ({
          questions: [
            ...state.questions,
            { id: Date.now(), text: trimmed, category },
          ],
        }))
        return true
      },
      addQuestions: (items) => {
        const existing = new Set(get().questions.map(q => q.text))
        const newOnes = items
          .map(({ text, category }) => ({ text: text.trim(), category: category || '일반' }))
          .filter(({ text }) => text && !existing.has(text))
          .map(({ text, category }) => ({ id: Date.now() + Math.random(), text, category }))
        set(state => ({ questions: [...state.questions, ...newOnes] }))
        return newOnes.length
      },
      removeQuestion: (id) =>
        set(state => ({ questions: state.questions.filter(q => q.id !== id) })),
      updateQuestion: (id, text, category) =>
        set(state => ({
          questions: state.questions.map(q =>
            q.id === id ? { ...q, text, category } : q,
          ),
        })),
      clearQuestions: () => set({ questions: [] }),

      // --- Category Management ---
      categories: ['일반', '프론트엔드', '백엔드', 'CS/자료구조', '알고리즘', '행동면접'],
      addCategory: (name) => {
        if (!name.trim() || get().categories.includes(name.trim())) return
        set(state => ({ categories: [...state.categories, name.trim()] }))
      },

      // --- Session State ---
      session: null,
      // session shape: { questions, queue, currentIndex, askedIds, startedAt, recordings }
      startSession: (filterCategory = null) => {
        const all = get().questions.filter(q =>
          filterCategory ? q.category === filterCategory : true,
        )
        if (all.length === 0) return false
        const shuffled = [...all].sort(() => Math.random() - 0.5)
        set({
          session: {
            questions: shuffled,
            currentIndex: 0,
            askedIds: [shuffled[0].id],
            startedAt: Date.now(),
            recordings: [],
            filterCategory,
          },
        })
        return true
      },
      nextQuestion: () => {
        const { session } = get()
        if (!session) return
        const next = session.currentIndex + 1
        if (next >= session.questions.length) {
          // Re-shuffle for another round
          const reshuffled = [...session.questions].sort(() => Math.random() - 0.5)
          set({
            session: {
              ...session,
              questions: reshuffled,
              currentIndex: 0,
              askedIds: [...session.askedIds, reshuffled[0].id],
            },
          })
        } else {
          set({
            session: {
              ...session,
              currentIndex: next,
              askedIds: [...session.askedIds, session.questions[next].id],
            },
          })
        }
      },
      addRecording: (recording) => {
        set(state => ({
          session: state.session
            ? { ...state.session, recordings: [...state.session.recordings, recording] }
            : state.session,
        }))
      },
      endSession: () => set({ session: null }),
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
