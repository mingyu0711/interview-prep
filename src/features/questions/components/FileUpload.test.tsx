import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { createQuestionScreen } from '../../../test/questionScreen'
import { createQuestion, getQuestions } from '../api/questions'

let env: ReturnType<typeof createQuestionScreen>
beforeEach(() => { env = createQuestionScreen() })
afterEach(() => { env.close(); vi.restoreAllMocks() })
async function open() { env.render(); await env.ready(); return userEvent.setup() }
const fileInput = () => screen.getByLabelText('질문 파일')
const file = (content: string, name = 'questions.txt') => new File([content], name, { type: 'text/plain' })
const preview = () => within(screen.getByRole('region', { name: '파일 미리보기' }))
const submit = () => screen.getByRole('button', { name: /등록 가능한 \d+개 추가/ })

describe('파일 선택 → 미리보기 → API 등록', () => {
  it('A06: 원본 줄 번호·제외 사유·개수를 보여주고 확인 후에만 저장한다', async () => {
    await createQuestion({ text: 'React란?', category: '프론트엔드' })
    const user = await open()
    await user.upload(fileInput(), file('react란\n자기소개를 해주세요\n자기소개를  해주세요?\n일반::\n'))
    await screen.findByText('4개 중 등록 가능 1개 · 중복 2개 · 입력 오류 1개')
    expect(await getQuestions()).toHaveLength(1)
    const excluded = within(preview().getByRole('list', { name: '파일에서 제외된 항목' }))
    expect(excluded.getByText(/1줄:/)).toHaveTextContent('이미 등록된 질문')
    expect(excluded.getByText(/3줄:/)).toHaveTextContent('파일의 앞선 줄과 중복')
    expect(excluded.getByText(/4줄:/)).toHaveTextContent('질문 내용을 입력해주세요. 해당 줄에 질문을 적고 파일을 다시 선택해주세요.')
    await user.click(submit())
    await screen.findByText('4개 중 1개 추가 · 중복 2개 · 입력 오류 1개')
    expect((await getQuestions()).map(question => question.text)).toEqual(['React란?', '자기소개를 해주세요'])
    expect(screen.queryByRole('button', { name: /등록 가능한/ })).not.toBeInTheDocument()
  })

  it('A13: 예시 다운로드와 카테고리 적용을 안내하고 취소하면 전송하지 않는다', async () => {
    const user = await open()
    const example = screen.getByRole('link', { name: '예시 파일 다운로드 (.txt)' })
    expect(example).toHaveAttribute('download', 'questions-example.txt')
    expect(example).toHaveAttribute('href', '/questions-example.txt')
    await user.upload(fileInput(), file('자기소개\n네트워크::TCP란?'))
    await screen.findByRole('region', { name: '파일 미리보기' })
    expect(preview().getByText('1줄 · 일반')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('파일 기본 카테고리'), '백엔드')
    expect(preview().getByText('1줄 · 백엔드')).toBeInTheDocument()
    expect(preview().getByText('2줄 · 네트워크')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '파일 취소' }))
    expect(screen.queryByRole('region', { name: '파일 미리보기' })).not.toBeInTheDocument()
    expect(await getQuestions()).toEqual([])
  })

  it('A14: 빈 파일·제외 항목만 있는 파일·잘못된 확장자는 저장할 수 없다', async () => {
    await createQuestion({ text: 'React란?', category: '일반' })
    const user = await open()
    await user.upload(fileInput(), file('\n \n'))
    await screen.findByText('등록할 질문이 없습니다.')
    expect(submit()).toBeDisabled()
    await user.upload(fileInput(), file('react란\n일반::'))
    await screen.findByText('2개 중 등록 가능 0개 · 중복 1개 · 입력 오류 1개')
    expect(submit()).toBeDisabled()
    // accept는 파일 선택기의 힌트이므로 잘못된 파일이 전달되는 경우도 검증한다.
    fireEvent.change(fileInput(), { target: { files: [file('새 질문', 'questions.csv')] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('.txt 파일을 선택해주세요.')
    expect(screen.queryByRole('region', { name: '파일 미리보기' })).not.toBeInTheDocument()
    expect(await getQuestions()).toHaveLength(1)
  })

  it('A14: 새 파일 읽기 실패 시 이전 미리보기를 제거한다', async () => {
    const user = await open()
    await user.upload(fileInput(), file('첫 파일'))
    await screen.findByRole('region', { name: '파일 미리보기' })
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementationOnce(function (this: FileReader) {
      this.dispatchEvent(new Event('error'))
    })
    await user.upload(fileInput(), file('둘째 파일', 'second.txt'))
    expect(await screen.findByRole('alert')).toHaveTextContent('파일을 읽지 못했습니다.')
    expect(screen.queryByRole('button', { name: /등록 가능한/ })).not.toBeInTheDocument()
    expect(await getQuestions()).toEqual([])
  })

  it('늦게 끝난 이전 파일 읽기가 새 선택을 덮지 않는다', async () => {
    const user = await open()
    const original = FileReader.prototype.readAsText
    let finish: (() => Promise<void>) | undefined
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementationOnce(function (this: FileReader, blob) {
      finish = () => new Promise(resolve => {
        this.addEventListener('loadend', () => resolve(), { once: true })
        original.call(this, blob)
      })
    })
    await user.upload(fileInput(), file('늦은 첫 파일', 'first.txt'))
    expect(screen.getByText('파일을 읽는 중입니다.')).toBeInTheDocument()
    await user.upload(fileInput(), file('둘째 파일', 'second.txt'))
    await screen.findByText('second.txt · 미리보기')
    await act(async () => { await finish?.() })
    expect(preview().getByText('둘째 파일')).toBeInTheDocument()
    expect(screen.queryByText('늦은 첫 파일')).not.toBeInTheDocument()
  })

  it('A15: 실패 후 파일을 다시 고르지 않고 재시도하며 성공 후 재등록은 막는다', async () => {
    const user = await open()
    const requests = vi.spyOn(env.scenarios, 'consume')
    await user.upload(fileInput(), file('첫 질문\n둘째 질문'))
    await screen.findByRole('region', { name: '파일 미리보기' })
    env.scenarios.setScenario({ method: 'POST', path: '/api/questions/batch', scenario: 'error' })
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('다시 시도')
    expect(await getQuestions()).toEqual([])
    expect(submit()).toBeEnabled()
    expect(requests.mock.calls.filter(([request]) => request.method === 'POST')).toHaveLength(1)
    await user.click(submit())
    await screen.findByText('2개 중 2개 추가 · 중복 0개 · 입력 오류 0개')
    expect(await getQuestions()).toHaveLength(2)
    expect(requests.mock.calls.filter(([request]) => request.method === 'POST')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /등록 가능한/ })).not.toBeInTheDocument()
  })

  it('R23: 등록 지연 중 반복 클릭·파일·카테고리·취소를 잠근다', async () => {
    const user = await open()
    await user.upload(fileInput(), file('첫 질문'))
    await screen.findByRole('region', { name: '파일 미리보기' })
    env.scenarios.setScenario({ method: 'POST', path: '/api/questions/batch', scenario: 'delay' })
    const requests = vi.spyOn(env.scenarios, 'consume')
    fireEvent.click(submit())
    await waitFor(() => expect(screen.getByRole('button', { name: '등록 중…' })).toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: '등록 중…' }))
    expect(fileInput()).toBeDisabled()
    expect(screen.getByLabelText('파일 기본 카테고리')).toBeDisabled()
    expect(screen.getByRole('button', { name: '파일 취소' })).toBeDisabled()
    await screen.findByRole('region', { name: '파일 등록 결과' }, { timeout: 3000 })
    expect(requests.mock.calls.filter(([request]) => request.method === 'POST')).toHaveLength(1)
  })

  it('A16: 미리보기 이후 생긴 중복을 서버 결과에 반영하고 현재 필터는 유지한다', async () => {
    const user = await open()
    await user.click(screen.getByRole('button', { name: '백엔드 (0)' }))
    await user.upload(fileInput(), file('첫 질문\n둘째 질문'))
    await screen.findByText('2개 중 등록 가능 2개 · 중복 0개 · 입력 오류 0개')
    await createQuestion({ text: '첫 질문', category: '일반' })
    await user.click(submit())
    await screen.findByText('2개 중 1개 추가 · 중복 1개 · 입력 오류 0개')
    expect(screen.getByText('총 0개 (백엔드)')).toBeInTheDocument()
    expect(await getQuestions()).toHaveLength(2)
  })

  it('A17: 파일 응답 유실은 파일·입력을 남기고 자동 재전송하지 않는다', async () => {
    const user = await open()
    await user.upload(fileInput(), file('첫 질문'))
    await screen.findByRole('region', { name: '파일 미리보기' })
    const response = vi.fn(() => HttpResponse.error())
    env.server.use(http.post('/api/questions/batch', response))
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('처리 결과를 확인할 수 없습니다.')
    expect(preview().getByText('첫 질문')).toBeInTheDocument()
    expect(response).toHaveBeenCalledOnce()
    expect(submit()).toBeEnabled()
  })
})
