import type { StateCreator } from 'zustand'
import type { Session, Recording } from '../types'
import type { QuestionSlice } from './questionSlice'

export interface SessionSlice {
  session: Session | null
  startSession: (filterCategory?: string | null) => boolean
  nextQuestion: () => void
  restartSession: () => void
  addRecording: (recording: Recording) => void
  endSession: () => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export const createSessionSlice: StateCreator<
  SessionSlice & QuestionSlice,
  [],
  [],
  SessionSlice
> = (set, get) => ({
  session: null,

  startSession: (filterCategory = null) => {
    const pool = get().questions.filter(q =>
      filterCategory ? q.category === filterCategory : true,
    )
    if (pool.length === 0) return false
    const shuffled = shuffle(pool)
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
    const reshuffled = shuffle(session.questions)
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
        : null,
    }))
  },

  endSession: () => set({ session: null }),
})
