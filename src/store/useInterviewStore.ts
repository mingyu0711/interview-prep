import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Question {
  id: number
  text: string
  category: string
}

export interface Recording {
  questionText: string
  fileName: string
  duration: number
  blobURL: string
}

export interface Session {
  questions: Question[]
  currentIndex: number
  askedIds: number[]
  startedAt: number
  recordings: Recording[]
  filterCategory: string | null
  isDone: boolean
}

interface InterviewStore {
  questions: Question[]
  addQuestion: (text: string, category?: string) => boolean
  addQuestions: (items: { text: string; category?: string }[]) => number
  removeQuestion: (id: number) => void
  updateQuestion: (id: number, text: string, category: string) => void
  clearQuestions: () => void

  categories: string[]
  addCategory: (name: string) => void

  session: Session | null
  startSession: (filterCategory?: string | null) => boolean
  nextQuestion: () => void
  restartSession: () => void
  addRecording: (recording: Recording) => void
  endSession: () => void
}

const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      questions: [],
      addQuestion: (text, category = '일반') => {
        const trimmed = text.trim()
        if (!trimmed) return false
        const isDuplicate = get().questions.some(q => q.text === trimmed)
        if (isDuplicate) return false
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

      categories: ['일반', '프론트엔드', '백엔드', 'CS/자료구조', '알고리즘', '행동면접'],
      addCategory: (name) => {
        if (!name.trim() || get().categories.includes(name.trim())) return
        set(state => ({ categories: [...state.categories, name.trim()] }))
      },

      session: null,
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
            filterCategory: filterCategory ?? null,
            isDone: false,
          },
        })
        return true
      },
      nextQuestion: () => {
        const { session } = get()
        if (!session || session.isDone) return
        const next = session.currentIndex + 1
        if (next >= session.questions.length) {
          // 모든 질문 소진 → 완료 상태로 전환
          set({ session: { ...session, isDone: true } })
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
      restartSession: () => {
        const { session } = get()
        if (!session) return
        const reshuffled = [...session.questions].sort(() => Math.random() - 0.5)
        set({
          session: {
            ...session,
            questions: reshuffled,
            currentIndex: 0,
            askedIds: [reshuffled[0].id],
            startedAt: Date.now(),
            isDone: false,
          },
        })
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
