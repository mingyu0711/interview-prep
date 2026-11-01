import { z } from 'zod'
import { questionSchema } from '../model/question'
import { fileRejectionSchema } from '../model/questionFile'

export const questionListSchema = z.object({ questions: z.array(questionSchema) })
export const questionResultSchema = z.object({ question: questionSchema })
export const deleteAllResultSchema = z.object({ deletedCount: z.number().int().nonnegative() })

export const batchResultSchema = z.object({
  added: z.array(questionSchema),
  excluded: z.array(z.object({
    line: z.number().int().positive(),
    reasons: z.array(fileRejectionSchema).min(1),
  })),
  summary: z.object({
    total: z.number().int().nonnegative(),
    added: z.number().int().nonnegative(),
    duplicate: z.number().int().nonnegative(),
    invalid: z.number().int().nonnegative(),
  }),
}).refine(({ added, excluded, summary }) =>
  summary.added === added.length
  && summary.duplicate + summary.invalid === excluded.length
  && summary.total === summary.added + summary.duplicate + summary.invalid,
'일괄 등록 결과와 집계가 일치하지 않습니다.')

export type BatchResult = z.infer<typeof batchResultSchema>
