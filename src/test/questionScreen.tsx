import { QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createQuestionMockServer } from '../mocks/node'
import useCategoryStore from '../store/useCategoryStore'
import useInterviewStore from '../store/useInterviewStore'
import SetupPage from '../pages/SetupPage'
import { createQueryClient } from '../shared/api/queryClient'

export function createQuestionScreen() {
  const mock = createQuestionMockServer()
  mock.server.listen({ onUnhandledFrame: 'error' })
  const client = createQueryClient()
  useCategoryStore.setState(useCategoryStore.getInitialState(), true)
  useInterviewStore.setState(useInterviewStore.getInitialState(), true)
  return {
    ...mock, client,
    render: () => render(<QueryClientProvider client={client}><MemoryRouter><Routes>
      <Route path="/" element={<SetupPage />} />
      <Route path="/session" element={<h1>면접 화면</h1>} />
    </Routes></MemoryRouter></QueryClientProvider>),
    ready: async () => { await screen.findByText(/^총 \d+개/) },
    close: () => { cleanup(); client.clear(); mock.server.close() },
  }
}
