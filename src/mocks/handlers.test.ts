import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuestionMockServer } from './node'
import { createMemoryStorage, type MockStorage } from './storage'

let storage: MockStorage
let mock: ReturnType<typeof createQuestionMockServer>

beforeEach(() => {
  storage = createMemoryStorage()
  mock = createQuestionMockServer(storage)
  mock.server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  mock.server.resetHandlers()
  mock.scenarios.reset()
  mock.server.close()
  vi.restoreAllMocks()
})

function request(method: string, path = '/api/questions', body?: unknown) {
  return fetch(new URL(path, window.location.origin), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function register(text: string, category = '일반') {
  return request('POST', '/api/questions', { text, category })
}

describe('질문 API 계약', () => {
  it('빈 목록에서 시작하고 등록 순서·원문을 보존해 조회한다', async () => {
    const initial = await request('GET')
    expect(initial.status).toBe(200)
    expect(await initial.json()).toEqual({ questions: [] })
    const created = await register('  React의  상태란?  ', ' 프론트엔드 ')
    expect(created.status).toBe(201)
    expect(await created.json()).toEqual({ question: { id: 1, text: 'React의  상태란?', category: '프론트엔드' } })
    await register('자기소개')
    expect(await (await request('GET')).json()).toEqual({ questions: [
      { id: 1, text: 'React의  상태란?', category: '프론트엔드' },
      { id: 2, text: '자기소개', category: '일반' },
    ] })
  })

  it.each([
    { text: '  ', category: '일반' },
    { text: '자기소개', category: '' },
    { text: '자기소개' },
    { text: 42, category: '일반' },
  ])('잘못된 등록 입력 %j는 400이며 저장하지 않는다', async input => {
    const response = await request('POST', '/api/questions', input)
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    expect(storage.read()).toBeNull()
  })

  it('잘못된 JSON은 서버 오류가 아니라 400으로 안내한다', async () => {
    const response = await fetch(new URL('/api/questions', window.location.origin), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  })

  it('직접 등록·편집 모두 실제 DB의 다른 질문과 중복이면 409로 거절한다', async () => {
    await register('React란?', '프론트엔드')
    await register('자기소개')
    const before = storage.read()
    const duplicate = await register(' react란 ', '백엔드')
    expect(duplicate.status).toBe(409)
    expect(await duplicate.json()).toMatchObject({ error: { code: 'QUESTION_DUPLICATE' } })
    const edit = await request('PATCH', '/api/questions/2', { text: 'react란', category: '일반' })
    expect(edit.status).toBe(409)
    expect(await edit.json()).toMatchObject({ error: { code: 'QUESTION_DUPLICATE' } })
    expect(storage.read()).toBe(before)
  })

  it('자기 자신은 편집할 수 있고 ID·목록 위치를 유지한다', async () => {
    await register('React란?')
    await register('자기소개')
    const response = await request('PATCH', '/api/questions/1', { text: ' react란 ', category: '프론트엔드' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ question: { id: 1, text: 'react란', category: '프론트엔드' } })
    expect(await (await request('GET')).json()).toEqual({ questions: [
      { id: 1, text: 'react란', category: '프론트엔드' },
      { id: 2, text: '자기소개', category: '일반' },
    ] })
  })

  it('없는 질문의 편집은 404, 반복 삭제는 204이며 다른 질문을 보존한다', async () => {
    await register('첫 질문')
    await register('둘째 질문')
    const deleted = await request('DELETE', '/api/questions/1')
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe('')
    expect((await request('DELETE', '/api/questions/1')).status).toBe(204)
    const edited = await request('PATCH', '/api/questions/1', { text: '변경', category: '일반' })
    expect(edited.status).toBe(404)
    expect(await edited.json()).toMatchObject({ error: { code: 'QUESTION_NOT_FOUND' } })
    expect(await (await request('GET')).json()).toEqual({ questions: [{ id: 2, text: '둘째 질문', category: '일반' }] })
  })

  it('전체 삭제는 실제 개수를 반환하고 다음 ID를 초기화하지 않는다', async () => {
    await register('첫 질문')
    await register('둘째 질문', '프론트엔드')
    const deleted = await request('DELETE')
    expect(deleted.status).toBe(200)
    expect(await deleted.json()).toEqual({ deletedCount: 2 })
    expect(await (await request('DELETE')).json()).toEqual({ deletedCount: 0 })
    expect(await (await register('다음 질문')).json()).toMatchObject({ question: { id: 3 } })
  })

  it('일괄 등록은 원본 줄 순서로 분류하고 유효 항목 전체를 한 번에 저장한다', async () => {
    await register('React란?')
    const write = vi.spyOn(storage, 'write')
    const response = await request('POST', '/api/questions/batch', { items: [
      { line: 6, text: '백엔드 질문', category: '백엔드' },
      { line: 1, text: 'react란', category: '일반' },
      { line: 2, text: '자기소개를 해주세요', category: '일반' },
      { line: 3, text: '자기소개를  해주세요?', category: '프론트엔드' },
      { line: 4, text: '', category: '' },
    ] })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      added: [
        { id: 2, text: '자기소개를 해주세요', category: '일반' },
        { id: 3, text: '백엔드 질문', category: '백엔드' },
      ],
      excluded: [
        { line: 1, reasons: ['ALREADY_EXISTS'] },
        { line: 3, reasons: ['DUPLICATE_IN_FILE'] },
        { line: 4, reasons: ['EMPTY_TEXT', 'EMPTY_CATEGORY'] },
      ],
      summary: { total: 5, added: 2, duplicate: 2, invalid: 1 },
    })
    expect(write).toHaveBeenCalledOnce()
  })

  it('추가할 항목이 없는 일괄 등록도 200과 제외 내역을 반환한다', async () => {
    await register('React란?')
    const before = storage.read()
    const response = await request('POST', '/api/questions/batch', { items: [
      { line: 1, text: 'react란', category: '일반' },
      { line: 2, text: '', category: '일반' },
    ] })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      added: [],
      excluded: [{ line: 1, reasons: ['ALREADY_EXISTS'] }, { line: 2, reasons: ['EMPTY_TEXT'] }],
      summary: { total: 2, added: 0, duplicate: 1, invalid: 1 },
    })
    expect(storage.read()).toBe(before)
  })

  it.each([
    { items: '질문' },
    { items: [{ line: 0, text: '질문', category: '일반' }] },
    { items: [{ line: 1, text: '질문', category: '일반' }, { line: 1, text: '다른 질문', category: '일반' }] },
  ])('일괄 등록 계약 오류 %j는 전체 요청을 거절한다', async body => {
    const response = await request('POST', '/api/questions/batch', body)
    expect(response.status).toBe(400)
    expect(storage.read()).toBeNull()
  })
})

describe('저장과 실패 시나리오', () => {
  it('동일 저장 어댑터로 서버를 다시 만들어도 목록·다음 ID가 유지된다', async () => {
    await register('기존 질문')
    mock.server.close()
    mock = createQuestionMockServer(storage)
    mock.server.listen({ onUnhandledFrame: 'error' })
    expect(await (await request('GET')).json()).toEqual({ questions: [{ id: 1, text: '기존 질문', category: '일반' }] })
    expect(await (await register('다음 질문')).json()).toMatchObject({ question: { id: 2 } })
  })

  it('저장 실패 시 일괄 등록을 일부 반영하거나 다음 ID를 소비하지 않는다', async () => {
    await register('기존 질문')
    const before = storage.read()
    vi.spyOn(storage, 'write').mockImplementationOnce(() => { throw new Error('저장 불가') })
    const body = { items: [
      { line: 1, text: '새 질문 하나', category: '일반' },
      { line: 2, text: '새 질문 둘', category: '일반' },
    ] }
    const failed = await request('POST', '/api/questions/batch', body)
    expect(failed.status).toBe(500)
    expect(await failed.json()).toMatchObject({ error: { code: 'MOCK_DB_UNAVAILABLE' } })
    expect(storage.read()).toBe(before)
    const retry = await request('POST', '/api/questions/batch', body)
    expect(await retry.json()).toMatchObject({
      added: [{ id: 2, text: '새 질문 하나' }, { id: 3, text: '새 질문 둘' }],
      summary: { added: 2 },
    })
  })

  it('손상된 Mock DB를 빈 목록으로 덮지 않고 조회·변경을 500으로 거절한다', async () => {
    storage.write('{broken')
    expect((await request('GET')).status).toBe(500)
    expect((await register('새 질문')).status).toBe(500)
    expect(storage.read()).toBe('{broken')
  })

  it('실패 설정은 메서드·경로·횟수에만 적용하고 데이터는 유지한다', async () => {
    await register('기존 질문')
    const before = storage.read()
    mock.scenarios.setScenario({ method: 'POST', path: '/api/questions', scenario: 'error', times: 2 })
    expect((await request('GET')).status).toBe(200)
    expect((await register('새 질문')).status).toBe(500)
    expect((await register('새 질문')).status).toBe(500)
    expect(storage.read()).toBe(before)
    expect((await register('새 질문')).status).toBe(201)
    mock.scenarios.setScenario({ method: 'POST', path: '/api/questions', scenario: 'error' })
    expect((await request('POST', '/api/questions/batch', { items: [] })).status).toBe(200)
    mock.scenarios.setScenario({ method: 'POST', path: '/api/questions', scenario: 'normal' })
    expect((await register('다음 질문')).status).toBe(201)
  })

  it('저장 후 GET 1회 실패해도 저장 결과는 남고 다음 조회는 성공한다', async () => {
    mock.scenarios.setScenario({ method: 'GET', path: '/api/questions', scenario: 'error' })
    expect((await register('저장된 질문')).status).toBe(201)
    expect((await request('GET')).status).toBe(500)
    expect(await (await request('GET')).json()).toEqual({ questions: [{ id: 1, text: '저장된 질문', category: '일반' }] })
  })

  it('지연 중 같은 질문이 먼저 등록되면 최신 DB 기준으로 409를 반환한다', async () => {
    mock.scenarios.setScenario({ method: 'POST', path: '/api/questions', scenario: 'delay' })
    const consume = mock.scenarios.consume
    const started = new Promise<void>(resolve => {
      vi.spyOn(mock.scenarios, 'consume').mockImplementation(request => {
        const scenario = consume(request)
        if (scenario === 'delay') resolve()
        return scenario
      })
    })
    const delayed = register('React란?')
    await started
    expect((await register('react란', '프론트엔드')).status).toBe(201)
    expect((await delayed).status).toBe(409)
    expect(await (await request('GET')).json()).toEqual({ questions: [{ id: 1, text: 'react란', category: '프론트엔드' }] })
  })
})
