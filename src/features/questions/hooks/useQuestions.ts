import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../shared/api/http'
import { createQuestion, createQuestions, deleteAllQuestions, deleteQuestion, getQuestions, updateQuestion } from '../api/questions'

export const questionsKey = ['questions'] as const
const writesKey = ['questions', 'write'] as const
const deleteKey = [...writesKey, 'delete'] as const
const clearKey = [...writesKey, 'clear'] as const

export function useQuestionWriteState() {
  const pending = useIsMutating({ mutationKey: writesKey }) > 0
  const clearing = useIsMutating({ mutationKey: clearKey }) > 0
  return { pending, clearing }
}

export function useQuestionDeletePending(id: number) {
  return useIsMutating({
    mutationKey: deleteKey,
    predicate: mutation => mutation.state.variables === id,
  }) > 0
}

export function useQuestions() {
  return useQuery({
    queryKey: questionsKey,
    queryFn: getQuestions,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  })
}

function useRefreshQuestions() {
  const client = useQueryClient()
  // 저장 성공 뒤 조회만 실패해도 mutation은 성공으로 유지한다.
  return () => client.invalidateQueries({ queryKey: questionsKey }, { throwOnError: false })
}

export function useCreateQuestion() {
  const refresh = useRefreshQuestions()
  return useMutation({ mutationKey: [...writesKey, 'create'], mutationFn: createQuestion, retry: false, onSuccess: refresh })
}

export function useCreateQuestions() {
  const refresh = useRefreshQuestions()
  return useMutation({ mutationKey: [...writesKey, 'batch'], mutationFn: createQuestions, retry: false, onSuccess: refresh })
}

export function useUpdateQuestion() {
  const refresh = useRefreshQuestions()
  return useMutation({
    mutationKey: [...writesKey, 'update'],
    mutationFn: updateQuestion,
    retry: false,
    onSuccess: refresh,
    onError: error => {
      if (error instanceof ApiError && error.status === 404) return refresh()
    },
  })
}

export function useDeleteQuestion() {
  const refresh = useRefreshQuestions()
  return useMutation({ mutationKey: deleteKey, mutationFn: deleteQuestion, retry: false, onSuccess: refresh })
}

export function useDeleteAllQuestions() {
  const refresh = useRefreshQuestions()
  return useMutation({ mutationKey: clearKey, mutationFn: deleteAllQuestions, retry: false, onSuccess: refresh })
}
