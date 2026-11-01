import { describe, expect, it } from 'vitest'
import { createMockDb, MockDbError } from './db'
import { createBrowserStorage, MOCK_DB_KEY } from './storage'

describe('브라우저 Mock DB 경계', () => {
  it('기존 앱·카테고리 키를 읽지 않고 전용 키로만 저장·복원한다', () => {
    localStorage.setItem('interview-prep-store', '기존 질문 데이터')
    localStorage.setItem('interview-prep-categories-v1', '카테고리 데이터')
    const db = createMockDb(createBrowserStorage())
    expect(db.read().questions).toEqual([])
    const state = { schemaVersion: 1 as const, questions: [{ id: 1, text: '새 질문', category: '일반' }], nextQuestionId: 2 }
    db.write(state)
    expect(createMockDb(createBrowserStorage()).read()).toEqual(state)
    expect(localStorage.getItem('interview-prep-store')).toBe('기존 질문 데이터')
    expect(localStorage.getItem('interview-prep-categories-v1')).toBe('카테고리 데이터')
    expect(localStorage.getItem(MOCK_DB_KEY)).toBe(JSON.stringify(state))
  })

  it('JSON 문법이 맞아도 저장 데이터 형식이 다르면 원본을 보존하고 거절한다', () => {
    const saved = JSON.stringify({ schemaVersion: 1, questions: '잘못된 값', nextQuestionId: 1 })
    localStorage.setItem(MOCK_DB_KEY, saved)
    expect(() => createMockDb(createBrowserStorage()).read()).toThrow(MockDbError)
    expect(localStorage.getItem(MOCK_DB_KEY)).toBe(saved)
  })
})
