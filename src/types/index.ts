import type { Question } from '../features/questions/model/question'
export type { Question } from '../features/questions/model/question'

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
