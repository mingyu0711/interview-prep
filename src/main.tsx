import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from './shared/api/queryClient'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('앱을 렌더링할 #root 요소가 없습니다.')
}

const root = createRoot(rootElement)
const queryClient = createQueryClient()

async function start() {
  if (import.meta.env.VITE_API_MODE !== 'server') {
    const { startQuestionMock } = await import('./mocks/browser')
    await startQuestionMock()
  }
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
    </StrictMode>,
  )
}

void start().catch(() => {
  root.render(<main className="p-6 space-y-4">
    <p role="alert">앱을 시작하지 못했습니다. 페이지를 새로고침해주세요.</p>
    <button onClick={() => window.location.reload()}>새로고침</button>
  </main>)
})
