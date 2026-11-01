import { useEffect, useRef, useState } from 'react'
import type { Question } from '../model/question'
import { evaluateQuestionBatch, parseQuestionFile } from '../model/questionFile'
import type { BatchResult } from '../api/questionSchemas'
import { useCreateQuestions } from './useQuestions'
import { requestMessage } from './requestMessage'

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('invalid text'))
    reader.onerror = () => reject(reader.error)
    reader.onabort = () => reject(new Error('aborted'))
    reader.readAsText(file)
  })
}

export function useQuestionFile(questions: readonly Question[], disabled = false) {
  const [file, setFile] = useState<{ name: string; content: string } | null>(null)
  const [defaultCategory, setDefaultCategory] = useState('일반')
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BatchResult | null>(null)
  const sequence = useRef(0)
  const submitting = useRef(false)
  const mutation = useCreateQuestions()
  const rows = file ? parseQuestionFile(file.content, defaultCategory) : []
  const preview = evaluateQuestionBatch(rows, questions)

  useEffect(() => () => { sequence.current += 1 }, [])

  const selectFile = async (next: File) => {
    if (submitting.current) return
    const current = ++sequence.current
    setFile(null)
    setResult(null)
    setError('')
    setReading(false)
    if (!/\.txt$/i.test(next.name)) {
      setError('.txt 파일을 선택해주세요. 원본을 텍스트 파일로 저장한 뒤 다시 선택해주세요.')
      return
    }
    setReading(true)
    try {
      const content = await readFile(next)
      if (sequence.current === current) setFile({ name: next.name, content })
    } catch {
      if (sequence.current === current) setError('파일을 읽지 못했습니다. 파일을 확인한 뒤 다시 선택해주세요.')
    } finally {
      if (sequence.current === current) setReading(false)
    }
  }

  const cancel = () => {
    if (submitting.current) return
    sequence.current += 1
    setFile(null)
    setResult(null)
    setReading(false)
    setError('')
  }

  const submit = async () => {
    if (disabled || submitting.current || reading || !file || result || preview.accepted.length === 0) return
    submitting.current = true
    setError('')
    try {
      // 미리보기에서 제외된 줄도 전송해 서버의 최종 결과와 전체 개수를 맞춘다.
      setResult(await mutation.mutateAsync(rows))
    } catch (error) {
      setError(requestMessage(error))
    } finally {
      submitting.current = false
    }
  }

  return { file, rows, defaultCategory, setDefaultCategory, reading, error, result, preview, selectFile, cancel, submit, pending: mutation.isPending }
}
