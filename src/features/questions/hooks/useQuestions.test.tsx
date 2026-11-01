import type { PropsWithChildren } from 'react'
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw/http'
import { createQuestionMockServer } from '../../../mocks/node'
import { createQuestion, deleteQuestion, getQuestions } from '../api/questions'
import { createQueryClient } from '../../../shared/api/queryClient'
import {
  useCreateQuestion, useCreateQuestions, useDeleteAllQuestions,
  useDeleteQuestion, useQuestions, useUpdateQuestion,
} from './useQuestions'

let mock: ReturnType<typeof createQuestionMockServer>
let client: QueryClient

beforeEach(() => {
  mock = createQuestionMockServer()
  mock.server.listen({ onUnhandledFrame: 'error' })
  client = createQueryClient()
})

afterEach(() => {
  client.clear()
  onlineManager.setOnline(true)
  mock.server.resetHandlers()
  mock.scenarios.reset()
  mock.server.close()
  vi.restoreAllMocks()
})

function Wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Query·API·MSW 연결', () => {
  it.each([true, false])('연결 상태 %s: 등록·일괄 등록·편집·삭제가 같은 조회 목록을 갱신한다', async online => {
    onlineManager.setOnline(online)
    const { result } = renderHook(() => ({
      list: useQuestions(),
      create: useCreateQuestion(),
      batch: useCreateQuestions(),
      update: useUpdateQuestion(),
      remove: useDeleteQuestion(),
      clear: useDeleteAllQuestions(),
    }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(result.current.list.data).toEqual([])

    await act(async () => {
      await result.current.create.mutateAsync({ text: '첫 질문', category: '일반' })
    })
    await waitFor(() => expect(result.current.list.data).toEqual([{ id: 1, text: '첫 질문', category: '일반' }]))
    await act(async () => {
      await result.current.batch.mutateAsync([{ line: 1, text: '둘째 질문', category: '프론트엔드' }])
    })
    await waitFor(() => expect(result.current.list.data).toHaveLength(2))
    await act(async () => {
      await result.current.update.mutateAsync({ id: 1, input: { text: '바꾼 질문', category: '백엔드' } })
    })
    await waitFor(() => expect(result.current.list.data?.[0]).toEqual({ id: 1, text: '바꾼 질문', category: '백엔드' }))
    await act(async () => { await result.current.remove.mutateAsync(1) })
    await waitFor(() => expect(result.current.list.data).toEqual([{ id: 2, text: '둘째 질문', category: '프론트엔드' }]))
    await act(async () => { await result.current.clear.mutateAsync() })
    await waitFor(() => expect(result.current.list.data).toEqual([]))
  })

  it('저장 성공 후 조회만 실패하면 mutation 성공·이전 목록을 유지하고 저장을 재전송하지 않는다', async () => {
    await createQuestion({ text: '기존 질문', category: '일반' })
    const { result } = renderHook(() => ({ list: useQuestions(), create: useCreateQuestion() }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    const requests = vi.spyOn(mock.scenarios, 'consume')
    mock.scenarios.setScenario({ method: 'GET', path: '/api/questions', scenario: 'error' })

    await act(async () => {
      await expect(result.current.create.mutateAsync({ text: '새 질문', category: '일반' }))
        .resolves.toEqual({ id: 2, text: '새 질문', category: '일반' })
    })
    await waitFor(() => {
      expect(result.current.create.isSuccess).toBe(true)
      expect(result.current.list.isRefetchError).toBe(true)
    })
    expect(result.current.list.data).toEqual([{ id: 1, text: '기존 질문', category: '일반' }])
    expect(requests.mock.calls.map(([request]) => request.method)).toEqual(['POST', 'GET'])

    await act(async () => { await result.current.list.refetch() })
    await waitFor(() => expect(result.current.list.data).toHaveLength(2))
    expect(requests.mock.calls.map(([request]) => request.method)).toEqual(['POST', 'GET', 'GET'])
  })

  it('저장 전 500 실패는 자동 재시도하지 않고 사용자 재시도로만 저장한다', async () => {
    const { result } = renderHook(() => ({ list: useQuestions(), create: useCreateQuestion() }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    const requests = vi.spyOn(mock.scenarios, 'consume')
    mock.scenarios.setScenario({ method: 'POST', path: '/api/questions', scenario: 'error' })
    await act(async () => {
      await expect(result.current.create.mutateAsync({ text: '질문', category: '일반' }))
        .rejects.toMatchObject({ kind: 'http', status: 500 })
    })
    await waitFor(() => expect(result.current.create.isError).toBe(true))
    expect(result.current.list.data).toEqual([])
    expect(requests.mock.calls.map(([request]) => request.method)).toEqual(['POST'])
    await act(async () => {
      await result.current.create.mutateAsync({ text: '질문', category: '일반' })
    })
    await waitFor(() => expect(result.current.list.data).toHaveLength(1))
    expect(requests.mock.calls.map(([request]) => request.method)).toEqual(['POST', 'POST', 'GET'])
  })

  it('응답을 받지 못하면 mutation 실패 상태를 유지하고 자동 재전송·조회하지 않는다', async () => {
    const response = vi.fn(() => HttpResponse.error())
    mock.server.use(http.post('/api/questions', response))
    const { result } = renderHook(() => ({ list: useQuestions(), create: useCreateQuestion() }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    const requests = vi.spyOn(mock.scenarios, 'consume')
    onlineManager.setOnline(false)
    await act(async () => {
      await expect(result.current.create.mutateAsync({ text: '질문', category: '일반' }))
        .rejects.toMatchObject({ kind: 'network' })
    })
    await waitFor(() => expect(result.current.create.isError).toBe(true))
    expect(response).toHaveBeenCalledOnce()
    expect(requests).not.toHaveBeenCalled()
    expect(result.current.list.data).toEqual([])
    await act(async () => { onlineManager.setOnline(true) })
    expect(response).toHaveBeenCalledOnce()
    expect(requests).not.toHaveBeenCalled()
  })

  it('편집 대상이 사라지면 404를 유지하면서 목록을 다시 조회한다', async () => {
    await createQuestion({ text: '삭제할 질문', category: '일반' })
    const { result } = renderHook(() => ({ list: useQuestions(), update: useUpdateQuestion() }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.list.data).toHaveLength(1))
    await deleteQuestion(1)
    await act(async () => {
      await expect(result.current.update.mutateAsync({ id: 1, input: { text: '바꿀 질문', category: '일반' } }))
        .rejects.toMatchObject({ status: 404, code: 'QUESTION_NOT_FOUND' })
    })
    await waitFor(() => expect(result.current.list.data).toEqual([]))
    expect(await getQuestions()).toEqual([])
  })
})
