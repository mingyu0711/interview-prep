import type { FileRejection } from '../model/questionFile'

export const questionMessages = {
  EMPTY_TEXT: '질문 내용을 입력해주세요.',
  EMPTY_CATEGORY: '카테고리를 입력해주세요.',
  ALREADY_EXISTS: '이미 등록된 질문입니다.',
  DUPLICATE_IN_FILE: '파일의 앞선 줄과 중복된 질문입니다.',
  QUESTION_NOT_FOUND: '삭제된 질문입니다. 목록을 확인해주세요.',
} satisfies Record<FileRejection | 'QUESTION_NOT_FOUND', string>

export const fileCorrectionMessages: Record<FileRejection, string> = {
  EMPTY_TEXT: '해당 줄에 질문을 적고 파일을 다시 선택해주세요.',
  EMPTY_CATEGORY: '카테고리를 적거나 ::를 제거해주세요.',
  ALREADY_EXISTS: '기존 질문을 확인하고 해당 줄을 제거하거나 수정해주세요.',
  DUPLICATE_IN_FILE: '앞선 질문을 확인하고 해당 줄을 제거하거나 수정해주세요.',
}
