import { useRef } from 'react'
import useCategoryStore from '../../../store/useCategoryStore'
import Button from '../../../shared/components/Button'
import type { Question } from '../model/question'
import { useQuestionFile } from '../hooks/useQuestionFile'
import { fileCorrectionMessages, questionMessages } from './questionMessages'

export default function FileUpload({ questions, disabled = false }: { questions: readonly Question[]; disabled?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const categories = useCategoryStore(state => state.categories)
  const flow = useQuestionFile(questions, disabled)
  const options = categories.includes(flow.defaultCategory) ? categories : [flow.defaultCategory, ...categories]
  const locked = disabled || flow.pending
  const evaluation = flow.result ?? flow.preview

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-800">파일로 등록</h3>
      <p className="text-sm text-gray-600">
        한 줄에 질문 하나를 적어 주세요. 질문만 적으면 아래에서 선택한 카테고리로 등록됩니다.
        다른 카테고리는 <code className="bg-gray-100 px-1 rounded">백엔드::질문</code>처럼 적어 주세요.
      </p>
      <a href={`${import.meta.env.BASE_URL}questions-example.txt`} download="questions-example.txt" className="inline-block text-sm text-indigo-600 underline">예시 파일 다운로드 (.txt)</a>
      <div className="flex items-center gap-3 flex-wrap">
        <select aria-label="파일 기본 카테고리" disabled={locked || Boolean(flow.result)} value={flow.defaultCategory} onChange={e => flow.setDefaultCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          {options.map(category => <option key={category}>{category}</option>)}
        </select>
        <Button variant="secondary" disabled={locked} onClick={() => fileRef.current?.click()}>텍스트 파일 선택</Button>
        <input aria-label="질문 파일" ref={fileRef} type="file" accept=".txt" disabled={locked} className="hidden" onChange={event => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void flow.selectFile(file)
        }} />
        {(flow.file || flow.reading) && <Button variant="ghost" disabled={locked} onClick={flow.cancel}>파일 취소</Button>}
      </div>
      {flow.reading && <p role="status" className="text-sm">파일을 읽는 중입니다.</p>}
      {flow.error && <p role="alert" className="text-sm text-red-600">{flow.error}</p>}
      {flow.file && <section aria-label={flow.result ? '파일 등록 결과' : '파일 미리보기'} className="border border-gray-200 rounded-lg p-3 space-y-3">
        <h4 className="font-medium text-sm break-all">{flow.file.name} · {flow.result ? '등록 결과' : '미리보기'}</h4>
        <p role="status" className="text-sm text-gray-700">
          {evaluation.summary.total === 0 ? '등록할 질문이 없습니다.' : `${evaluation.summary.total}개 중 ${flow.result ? `${evaluation.summary.added}개 추가` : `등록 가능 ${evaluation.summary.added}개`} · 중복 ${evaluation.summary.duplicate}개 · 입력 오류 ${evaluation.summary.invalid}개`}
        </p>
        {!flow.result && <>
          <p className="text-xs text-gray-500">현재 목록 기준의 미리보기입니다. 수정하려면 원본 파일을 고친 뒤 다시 선택해주세요.</p>
          <ol aria-label="파일 질문 미리보기" className="max-h-64 overflow-auto space-y-2 text-sm">
            {flow.rows.map(row => <li key={row.line} className="border-b border-gray-100 pb-2 break-words">
              <span className="text-gray-500">{row.line}줄 · {row.category || '카테고리 없음'}</span>
              <p>{row.text || '(빈 질문)'}</p>
            </li>)}
          </ol>
        </>}
        {evaluation.excluded.length > 0 && <ul aria-label="파일에서 제외된 항목" className="space-y-2 text-xs text-gray-600">
          {evaluation.excluded.map(item => <li key={item.line}>{item.line}줄: {item.reasons.map(reason => `${questionMessages[reason]} ${fileCorrectionMessages[reason]}`).join(' ')}</li>)}
        </ul>}
        {!flow.result && <Button disabled={locked || flow.preview.accepted.length === 0} onClick={() => void flow.submit()}>
          {flow.pending ? '등록 중…' : `등록 가능한 ${flow.preview.accepted.length}개 추가`}
        </Button>}
      </section>}
    </div>
  )
}
