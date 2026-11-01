import { http, HttpResponse } from 'msw/http'
import { delay } from 'msw/utils/delay'
import { z } from 'zod'
import { questionInputSchema, validateQuestion } from '../features/questions/model/question'
import { batchRequestSchema, evaluateQuestionBatch } from '../features/questions/model/questionFile'
import { MockDbError, type MockDb } from './db'
import type { ScenarioController } from './scenarios'

const questionIdSchema = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive())

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status })
}

export function createQuestionHandlers(db: MockDb, scenarios: ScenarioController) {
  async function respond(request: Request, action: () => Response | Promise<Response>) {
    try {
      const scenario = scenarios.consume(request)
      if (scenario === 'delay') await delay(1500)
      if (scenario === 'error') {
        return errorResponse(500, 'INTERNAL_ERROR', '요청을 처리하지 못했습니다. 다시 시도해주세요.')
      }
      return await action()
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) {
        return errorResponse(400, 'INVALID_REQUEST', '입력 형식을 확인해주세요.')
      }
      if (error instanceof MockDbError) {
        return errorResponse(500, 'MOCK_DB_UNAVAILABLE', error.message)
      }
      return errorResponse(500, 'INTERNAL_ERROR', '요청 처리 중 오류가 발생했습니다.')
    }
  }

  return [
    http.get('/api/questions', ({ request }) => respond(request, () => {
      return HttpResponse.json({ questions: db.read().questions })
    })),

    http.post('/api/questions', ({ request }) => respond(request, async () => {
      const input = questionInputSchema.parse(await request.json())
      // 본문 읽기·지연 이후 최신 DB로 검사한다. 읽기부터 저장까지 await를 두지 않는다.
      const state = db.read()
      const result = validateQuestion(input, state.questions)
      if (!result.success) return errorResponse(409, 'QUESTION_DUPLICATE', '이미 등록된 질문입니다.')
      const question = { id: state.nextQuestionId, ...result.data }
      db.write({ ...state, questions: [...state.questions, question], nextQuestionId: question.id + 1 })
      return HttpResponse.json({ question }, { status: 201 })
    })),

    http.post('/api/questions/batch', ({ request }) => respond(request, async () => {
      const { items } = batchRequestSchema.parse(await request.json())
      const state = db.read()
      const result = evaluateQuestionBatch(items, state.questions)
      const added = result.accepted.map(({ text, category }, index) => ({
        id: state.nextQuestionId + index, text, category,
      }))
      if (added.length > 0) {
        db.write({ ...state, questions: [...state.questions, ...added], nextQuestionId: state.nextQuestionId + added.length })
      }
      return HttpResponse.json({ added, excluded: result.excluded, summary: result.summary })
    })),

    http.patch('/api/questions/:id', ({ request, params }) => respond(request, async () => {
      const id = questionIdSchema.parse(params.id)
      const input = questionInputSchema.parse(await request.json())
      const state = db.read()
      if (!state.questions.some(question => question.id === id)) {
        return errorResponse(404, 'QUESTION_NOT_FOUND', '삭제된 질문입니다. 목록을 확인해주세요.')
      }
      const result = validateQuestion(input, state.questions, id)
      if (!result.success) return errorResponse(409, 'QUESTION_DUPLICATE', '이미 등록된 질문입니다.')
      const question = { id, ...result.data }
      db.write({ ...state, questions: state.questions.map(item => item.id === id ? question : item) })
      return HttpResponse.json({ question })
    })),

    http.delete('/api/questions/:id', ({ request, params }) => respond(request, () => {
      const id = questionIdSchema.parse(params.id)
      const state = db.read()
      const questions = state.questions.filter(question => question.id !== id)
      if (questions.length !== state.questions.length) db.write({ ...state, questions })
      return new HttpResponse(null, { status: 204 })
    })),

    http.delete('/api/questions', ({ request }) => respond(request, () => {
      const state = db.read()
      if (state.questions.length > 0) db.write({ ...state, questions: [] })
      return HttpResponse.json({ deletedCount: state.questions.length })
    })),
  ]
}
