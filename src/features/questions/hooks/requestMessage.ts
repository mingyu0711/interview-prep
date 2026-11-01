import { ApiError } from '../../../shared/api/http'

export function requestMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind !== 'http') return '처리 결과를 확인할 수 없습니다. 목록을 새로고침해 확인한 뒤 다시 시도해주세요.'
    if (error.status === 409) return '이미 등록된 질문입니다. 내용을 확인해주세요.'
    if (error.status === 404) return '삭제된 질문입니다. 입력은 유지되지만 다시 저장할 수 없습니다.'
    if (error.status === 400) return '입력 형식을 확인하고 수정해주세요.'
  }
  return '요청을 처리하지 못했습니다. 다시 시도해주세요.'
}
