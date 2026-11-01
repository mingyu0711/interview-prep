import { describe, expect, it } from 'vitest'
import { questionComparisonKey, validateQuestion } from './question'

const existing = [{ id: 1, text: 'React란?', category: '프론트엔드' }]

describe('질문 입력 규칙 R01~R05', () => {
  it.each([
    ['자기소개', '  자기소개  ', true],
    ['React란?', 'react란?', true],
    ['자기소개를 해주세요', '자기소개를  해주세요', true],
    ['자기소개', '자기소개?', true],
    ['React란?', 'react란', true],
    ['C++란?', 'C란?', false],
    ['자기소개', '자기소개.', false],
    ['자기소개', '자기소개？', false],
  ])('%s / %s 비교 결과는 %s', (left, right, duplicate) => {
    expect(questionComparisonKey(left) === questionComparisonKey(right)).toBe(duplicate)
  })

  it('저장할 문장의 내부 공백·대소문자·기호는 보존한다', () => {
    expect(validateQuestion({ text: '  React의  상태란?  ', category: ' 일반 ' }, [])).toEqual({
      success: true, data: { text: 'React의  상태란?', category: '일반' },
    })
  })

  it('빈 질문과 빈 카테고리는 둘 다 안내한다', () => {
    expect(validateQuestion({ text: '  ', category: '  ' }, existing)).toEqual({
      success: false, reasons: ['EMPTY_TEXT', 'EMPTY_CATEGORY'],
    })
  })

  it('카테고리가 달라도 중복을 거절한다', () => {
    expect(validateQuestion({ text: ' react란 ', category: '일반' }, existing)).toEqual({
      success: false, reasons: ['ALREADY_EXISTS'],
    })
  })

  it('편집 대상 자신만 비교에서 제외한다', () => {
    const input = { text: 'react란', category: '일반' }
    expect(validateQuestion(input, existing, 1).success).toBe(true)
    expect(validateQuestion(input, [...existing, { id: 2, ...input }], 1).success).toBe(false)
    expect(existing[0].text).toBe('React란?')
  })
})
