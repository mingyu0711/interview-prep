import { z } from 'zod'
import { questionSchema } from '../features/questions/model/question'
import type { MockStorage } from './storage'

const mockDbSchema = z.object({
  schemaVersion: z.literal(1),
  questions: z.array(questionSchema.extend({ id: z.number().int().positive() })),
  nextQuestionId: z.number().int().positive(),
}).refine(state => {
  const ids = state.questions.map(question => question.id)
  return new Set(ids).size === ids.length && ids.every(id => id < state.nextQuestionId)
}, '질문 ID와 다음 ID가 일치하지 않습니다.')

export type MockDbState = z.infer<typeof mockDbSchema>

export class MockDbError extends Error {
  constructor() {
    super('질문 저장 공간에 접근할 수 없습니다.')
    this.name = 'MockDbError'
  }
}

export function createMockDb(storage: MockStorage) {
  return {
    read(): MockDbState {
      try {
        const saved = storage.read()
        return saved === null
          ? { schemaVersion: 1, questions: [], nextQuestionId: 1 }
          : mockDbSchema.parse(JSON.parse(saved))
      } catch {
        throw new MockDbError()
      }
    },
    write(state: MockDbState): void {
      try {
        storage.write(JSON.stringify(mockDbSchema.parse(state)))
      } catch {
        throw new MockDbError()
      }
    },
  }
}

export type MockDb = ReturnType<typeof createMockDb>
