import { setupServer } from 'msw/node'
import { createMockDb } from './db'
import { createQuestionHandlers } from './handlers'
import { createScenarioController } from './scenarios'
import { createMemoryStorage, type MockStorage } from './storage'

export function createQuestionMockServer(storage: MockStorage = createMemoryStorage()) {
  const scenarios = createScenarioController()
  const server = setupServer(...createQuestionHandlers(createMockDb(storage), scenarios))
  return { server, scenarios }
}
