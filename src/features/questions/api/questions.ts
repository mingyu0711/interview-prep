import { requestJson, requestNoContent } from '../../../shared/api/http'
import { questionInputSchema, type QuestionInput } from '../model/question'
import { batchRequestSchema, type BatchRow } from '../model/questionFile'
import { batchResultSchema, deleteAllResultSchema, questionListSchema, questionResultSchema } from './questionSchemas'

const path = '/api/questions'

export async function getQuestions() {
  return (await requestJson(path, questionListSchema)).questions
}

export async function createQuestion(input: QuestionInput) {
  const result = await requestJson(path, questionResultSchema, {
    method: 'POST', body: questionInputSchema.parse(input), expectedStatus: 201,
  })
  return result.question
}

export async function createQuestions(items: BatchRow[]) {
  return requestJson(`${path}/batch`, batchResultSchema, {
    method: 'POST', body: batchRequestSchema.parse({ items }),
  })
}

export async function updateQuestion({ id, input }: { id: number; input: QuestionInput }) {
  const result = await requestJson(`${path}/${encodeURIComponent(id)}`, questionResultSchema, {
    method: 'PATCH', body: questionInputSchema.parse(input),
  })
  return result.question
}

export function deleteQuestion(id: number) {
  return requestNoContent(`${path}/${encodeURIComponent(id)}`)
}

export function deleteAllQuestions() {
  return requestJson(path, deleteAllResultSchema, { method: 'DELETE' })
}
