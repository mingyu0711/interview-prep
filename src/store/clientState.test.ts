import { beforeEach, describe, expect, it, vi } from 'vitest'
import useCategoryStore from './useCategoryStore'
import useInterviewStore from './useInterviewStore'
import { DEFAULT_CATEGORIES } from '../constants/categories'

const key = 'interview-prep-categories-v1'
beforeEach(() => {
  localStorage.clear()
  useCategoryStore.setState(useCategoryStore.getInitialState(), true)
  useInterviewStore.setState(useInterviewStore.getInitialState(), true)
})

describe('클라이언트 상태 소유와 저장', () => {
  it('카테고리만 복원하고 기존 데이터는 읽거나 바꾸지 않는다', async () => {
    const legacy = '{"state":{"questions":[{"id":1,"text":"기존 질문","category":"일반"}],"categories":["옛 분류"]}}'
    localStorage.setItem('interview-prep-store', legacy)
    localStorage.setItem(key, JSON.stringify({ state: { categories: ['일반', '네트워크'] }, version: 1 }))
    const read = vi.spyOn(Storage.prototype, 'getItem')
    await useCategoryStore.persist.rehydrate()
    expect(useCategoryStore.getState().categories).toEqual(['일반', '네트워크'])
    expect(read.mock.calls).toEqual([[key]])
    useCategoryStore.getState().addCategory('새 분류')
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ state: { categories: ['일반', '네트워크', '새 분류'] }, version: 1 })
    expect(localStorage.getItem('interview-prep-store')).toBe(legacy)
    expect(useInterviewStore.getState()).not.toHaveProperty('questions')
    read.mockRestore()
  })

  it.each(['{broken', '{"state":{"categories":[5]},"version":1}', '{"state":{"categories":[]},"version":1}'])('잘못된 카테고리는 기본값으로 시작한다: %s', async saved => {
    localStorage.setItem(key, saved)
    await useCategoryStore.persist.rehydrate()
    expect(useCategoryStore.getState().categories).toEqual(DEFAULT_CATEGORIES)
  })

  it('세션은 전달받은 질문의 복사본이며 세션 변경을 저장하지 않는다', () => {
    const source = [{ id: 1, text: '원래 질문', category: '일반' }]
    const write = vi.spyOn(Storage.prototype, 'setItem')
    expect(useInterviewStore.getState().startSession(source, '백엔드')).toBe(false)
    expect(useInterviewStore.getState().startSession(source, '일반')).toBe(true)
    source[0].text = '캐시 변경'
    expect(useInterviewStore.getState().session?.questions[0].text).toBe('원래 질문')
    expect(write).not.toHaveBeenCalled()
    write.mockRestore()
  })
})
