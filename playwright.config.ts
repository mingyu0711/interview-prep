import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:5182'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 5182 --strictPort',
    env: { VITE_API_MODE: 'mock' },
    url: baseURL,
    reuseExistingServer: false,
  },
})
