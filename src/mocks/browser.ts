import { setupWorker } from 'msw/browser'
import { createMockDb } from './db'
import { createQuestionHandlers } from './handlers'
import { createScenarioController, type ScenarioController } from './scenarios'
import { createBrowserStorage } from './storage'

declare global {
  interface Window {
    __questionMock?: Pick<ScenarioController, 'setScenario' | 'reset'>
  }
}

const scenarios = createScenarioController()
const worker = setupWorker(...createQuestionHandlers(createMockDb(createBrowserStorage()), scenarios))

export async function startQuestionMock() {
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: 'bypass',
  })
  window.__questionMock = { setScenario: scenarios.setScenario, reset: scenarios.reset }
}
