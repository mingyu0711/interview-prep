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
