import { z } from 'zod'
import {
  questionComparisonKey,
  validateQuestion,
  type Question,
} from './question'

export const batchRowSchema = z.object({
  line: z.number().int().positive(),
  text: z.string(),
  category: z.string(),
})

export const batchRequestSchema = z.object({
  items: z.array(batchRowSchema).refine(
    rows => new Set(rows.map(row => row.line)).size === rows.length,
    '줄 번호가 중복되어 있습니다.',
  ),
})

export type BatchRow = z.infer<typeof batchRowSchema>
export const fileRejectionSchema = z.enum(['EMPTY_TEXT', 'EMPTY_CATEGORY', 'ALREADY_EXISTS', 'DUPLICATE_IN_FILE'])
export type FileRejection = z.infer<typeof fileRejectionSchema>
export interface BatchEvaluation {
  accepted: BatchRow[]
  excluded: { line: number; reasons: FileRejection[] }[]
  summary: { total: number; added: number; duplicate: number; invalid: number }
}

export function parseQuestionFile(content: string, defaultCategory: string): BatchRow[] {
  return content.replace(/^\uFEFF/, '').split(/\r?\n/).flatMap((raw, index) => {
    const row = raw.trim()
    if (!row) return []
    const separator = row.indexOf('::')
    return [{
      line: index + 1,
      text: separator < 0 ? row : row.slice(separator + 2).trim(),
      category: separator < 0 ? defaultCategory.trim() : row.slice(0, separator).trim(),
    }]
  })
}

export function evaluateQuestionBatch(rows: readonly BatchRow[], questions: readonly Question[]): BatchEvaluation {
  const accepted: BatchRow[] = []
  const excluded: BatchEvaluation['excluded'] = []
  const seen = new Set<string>()
  let duplicate = 0
  let invalid = 0

  for (const row of [...rows].sort((a, b) => a.line - b.line)) {
    const result = validateQuestion(row, questions)
    if (!result.success) {
      excluded.push({ line: row.line, reasons: result.reasons })
      if (result.reasons.includes('ALREADY_EXISTS')) duplicate++
      else invalid++
      continue
    }
    const key = questionComparisonKey(result.data.text)
    if (seen.has(key)) {
      excluded.push({ line: row.line, reasons: ['DUPLICATE_IN_FILE'] })
      duplicate++
      continue
    }
    seen.add(key)
    accepted.push({ line: row.line, ...result.data })
  }

  return { accepted, excluded, summary: { total: rows.length, added: accepted.length, duplicate, invalid } }
}
