import { z } from 'zod'

export const questionInputSchema = z.object({
  text: z.string().trim().min(1),
  category: z.string().trim().min(1),
})

export const questionSchema = z.object({
  id: z.number(),
  text: z.string().min(1),
  category: z.string().min(1),
})

export type QuestionInput = z.infer<typeof questionInputSchema>
export type Question = z.infer<typeof questionSchema>
export type InputError = 'EMPTY_TEXT' | 'EMPTY_CATEGORY'
export type QuestionRejection = InputError | 'ALREADY_EXISTS'
export type QuestionValidation =
  | { success: true; data: QuestionInput }
  | { success: false; reasons: QuestionRejection[] }

export function questionComparisonKey(text: string): string {
  return text.trim()
    .replace(/[A-Z]/g, character => character.toLowerCase())
    .replace(/\s+/g, ' ')
    .replace(/\?+$/, '')
    .trimEnd()
}

export function validateQuestion(
  input: QuestionInput,
  questions: readonly Question[],
  editingId?: number,
): QuestionValidation {
  const parsed = questionInputSchema.safeParse(input)
  if (!parsed.success) {
    const reasons: InputError[] = []
    if (parsed.error.issues.some(issue => issue.path[0] === 'text')) reasons.push('EMPTY_TEXT')
    if (parsed.error.issues.some(issue => issue.path[0] === 'category')) reasons.push('EMPTY_CATEGORY')
    return { success: false, reasons }
  }

  const key = questionComparisonKey(parsed.data.text)
  if (questions.some(question => question.id !== editingId && questionComparisonKey(question.text) === key)) {
    return { success: false, reasons: ['ALREADY_EXISTS'] }
  }
  return { success: true, data: parsed.data }
}
