import { describe, expect, it } from 'vitest'
import { evaluateQuestionBatch, parseQuestionFile } from './questionFile'

describe('파일 양식 R14~R15·R21', () => {
  it.each([
    ['자기소개', '자기소개', '선택 분류'],
    [' 프론트엔드 :: React란? ', 'React란?', '프론트엔드'],
    ['프론트엔드::', '', '프론트엔드'],
    ['::React란?', 'React란?', ''],
    ['::', '', ''],
    ['1. 자기소개', '1. 자기소개', '선택 분류'],
    ['프론트엔드:React란?', '프론트엔드:React란?', '선택 분류'],
    ['일반::A::B를 설명하세요', 'A::B를 설명하세요', '일반'],
  ])('%s를 질문과 카테고리로 해석한다', (content, text, category) => {
    expect(parseQuestionFile(content, '선택 분류')).toEqual([{ line: 1, text, category }])
  })

  it('BOM·CRLF·빈 줄을 처리하고 원본 줄 번호를 유지한다', () => {
    expect(parseQuestionFile('\uFEFF첫 질문\r\n \t\r\n일반::둘째 질문\n', '일반')).toEqual([
      { line: 1, text: '첫 질문', category: '일반' },
      { line: 3, text: '둘째 질문', category: '일반' },
    ])
    expect(parseQuestionFile('\uFEFF\n \t\r\n', '일반')).toEqual([])
  })
})

describe('파일 제외 사유와 집계 R06·R15 / A06', () => {
  it('기존 중복·파일 내부 중복·빈 질문을 각각 분류한다', () => {
    const questions = [{ id: 1, text: 'React란?', category: '프론트엔드' }]
    const rows = parseQuestionFile('react란\n자기소개를 해주세요\n자기소개를  해주세요?\n일반::\n', '일반')
    expect(evaluateQuestionBatch(rows, questions)).toEqual({
      accepted: [{ line: 2, text: '자기소개를 해주세요', category: '일반' }],
      excluded: [
        { line: 1, reasons: ['ALREADY_EXISTS'] },
        { line: 3, reasons: ['DUPLICATE_IN_FILE'] },
        { line: 4, reasons: ['EMPTY_TEXT'] },
      ],
      summary: { total: 4, added: 1, duplicate: 2, invalid: 1 },
    })
  })

  it('입력 오류를 먼저 판정하고 유효한 첫 항목의 문장·카테고리를 보존한다', () => {
    const rows = parseQuestionFile('::React란?\n프론트엔드:: React란? \n백엔드::react란\n::', '일반')
    const before = structuredClone(rows)
    expect(evaluateQuestionBatch(rows, [])).toEqual({
      accepted: [{ line: 2, text: 'React란?', category: '프론트엔드' }],
      excluded: [
        { line: 1, reasons: ['EMPTY_CATEGORY'] },
        { line: 3, reasons: ['DUPLICATE_IN_FILE'] },
        { line: 4, reasons: ['EMPTY_TEXT', 'EMPTY_CATEGORY'] },
      ],
      summary: { total: 4, added: 1, duplicate: 1, invalid: 2 },
    })
    expect(rows).toEqual(before)
    expect(evaluateQuestionBatch(rows, [{ id: 1, text: 'React란?', category: '일반' }]).excluded[0])
      .toEqual({ line: 1, reasons: ['EMPTY_CATEGORY'] })
  })

  it('배열 순서 대신 원본 줄 순서로 첫 항목을 결정한다', () => {
    const rows = [
      { line: 5, text: '자기소개?', category: '후순위' },
      { line: 2, text: '자기소개', category: '첫 분류' },
    ]
    expect(evaluateQuestionBatch(rows, []).accepted).toEqual([rows[1]])
    expect(rows[0].line).toBe(5)
  })
})
