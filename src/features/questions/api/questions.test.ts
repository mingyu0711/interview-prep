import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw/http'
import { createQuestionMockServer } from '../../../mocks/node'
import { createQuestion, createQuestions, deleteQuestion, getQuestions } from './questions'

let mock: ReturnType<typeof createQuestionMockServer>

beforeEach(() => {
  mock = createQuestionMockServer()
  mock.server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  mock.server.resetHandlers()
  mock.scenarios.reset()
  mock.server.close()
  vi.restoreAllMocks()
})

describe('질문 API 입출력 경계', () => {
  it.each([
    [400, 'INVALID_REQUEST'],
    [409, 'QUESTION_DUPLICATE'],
    [500, 'INTERNAL_ERROR'],
  ])('HTTP %s를 상태 코드와 오류 코드가 있는 실패로 전달한다', async (status, code) => {
    mock.server.use(http.post('/api/questions', () => HttpResponse.json({
      error: { code, message: '서버 오류 안내' },
    }, { status })))
    await expect(createQuestion({ text: '질문', category: '일반' })).rejects.toMatchObject({
      name: 'ApiError', kind: 'http', status, code, message: '서버 오류 안내',
    })
  })

  it('HTTP 오류 본문이 JSON이 아니어도 상태 코드를 잃지 않는다', async () => {
    mock.server.use(http.get('/api/questions', () => new HttpResponse('Service unavailable', { status: 503 })))
    await expect(getQuestions()).rejects.toMatchObject({ kind: 'http', status: 503 })
  })

  it('200 응답이라도 질문 형식이 다르면 빈 목록으로 대신하지 않는다', async () => {
    mock.server.use(http.get('/api/questions', () => HttpResponse.json({
      questions: [{ id: '1', text: '질문', category: '일반' }],
    })))
    await expect(getQuestions()).rejects.toMatchObject({ kind: 'invalid-response', status: 200 })
  })

  it('201 응답의 JSON이 손상됐으면 저장 성공으로 반환하지 않는다', async () => {
    mock.server.use(http.post('/api/questions', () => new HttpResponse('{', { status: 201 })))
    await expect(createQuestion({ text: '질문', category: '일반' })).rejects.toMatchObject({ kind: 'invalid-response', status: 201 })
  })

  it('fetch 실패는 HTTP 오류와 구분한다', async () => {
    mock.server.use(http.get('/api/questions', () => HttpResponse.error()))
    await expect(getQuestions()).rejects.toMatchObject({ kind: 'network', status: undefined })
  })

  it('삭제의 빈 204는 성공이며, 계약과 다른 200은 성공으로 해석하지 않는다', async () => {
    await expect(deleteQuestion(1)).resolves.toBeUndefined()
    mock.server.use(http.delete('/api/questions/:id', () => HttpResponse.json({})))
    await expect(deleteQuestion(1)).rejects.toMatchObject({ kind: 'invalid-response', status: 200 })
  })

  it('일괄 등록 내역과 집계가 다르면 성공 결과로 전달하지 않는다', async () => {
    mock.server.use(http.post('/api/questions/batch', () => HttpResponse.json({
      added: [], excluded: [], summary: { total: 1, added: 1, duplicate: 0, invalid: 0 },
    })))
    await expect(createQuestions([{ line: 1, text: '질문', category: '일반' }]))
      .rejects.toMatchObject({ kind: 'invalid-response', status: 200 })
  })

  it('입력 계약 위반은 요청을 보내기 전에 거절한다', async () => {
    const consume = vi.spyOn(mock.scenarios, 'consume')
    await expect(createQuestion({ text: ' ', category: '일반' })).rejects.toHaveProperty('name', 'ZodError')
    await expect(createQuestions([{ line: 0, text: '질문', category: '일반' }])).rejects.toHaveProperty('name', 'ZodError')
    expect(consume).not.toHaveBeenCalled()
  })
})
