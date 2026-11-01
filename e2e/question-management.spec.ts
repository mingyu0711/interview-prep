import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('등록 실패 후 재시도 → 새로고침 → 필터 → 면접 시작', async ({ page }, testInfo) => {
  const firstQuery = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/api/questions' && response.request().method() === 'GET',
  )
  await page.goto('/')
  const response = await firstQuery
  expect(response.status()).toBe(200)
  expect(response.fromServiceWorker()).toBe(true)
  await expect(page.getByText('아직 질문이 없습니다. 위에서 질문을 추가해보세요.')).toBeVisible()

  let registrations = 0
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/questions') registrations += 1
  })
  await page.evaluate(() => {
    if (!window.__questionMock) throw new Error('Mock 시나리오 제어기가 없습니다.')
    window.__questionMock.setScenario({ method: 'POST', path: '/api/questions', scenario: 'error' })
  })
  const input = page.getByRole('textbox', { name: '질문 내용' })
  await input.fill('자기소개를 해주세요')
  await input.press('Tab')
  await expect(page.getByRole('button', { name: '추가', exact: true })).toBeFocused()
  await input.press('Enter')
  await expect(page.getByRole('alert')).toContainText('다시 시도해주세요.')
  await expect(input).toHaveAccessibleDescription('요청을 처리하지 못했습니다. 다시 시도해주세요.')
  await expect(input).toHaveValue('자기소개를 해주세요')
  await expect(page.getByRole('article')).toHaveCount(0)
  expect(registrations).toBe(1)
  await page.screenshot({ path: testInfo.outputPath('registration-error.png'), fullPage: true })

  await page.evaluate(() => {
    if (!window.__questionMock) throw new Error('Mock 시나리오 제어기가 없습니다.')
    window.__questionMock.setScenario({ method: 'POST', path: '/api/questions', scenario: 'delay' })
  })
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await expect(input).toBeDisabled()
  await expect(page.getByRole('button', { name: '추가 중…' })).toBeDisabled()
  await expect(page.getByRole('article', { name: '자기소개를 해주세요' })).toBeVisible()
  await expect(input).toHaveValue('')
  expect(registrations).toBe(2)

  await page.getByLabel('질문 카테고리').selectOption('프론트엔드')
  await input.fill('React의 상태와 props 차이는?')
  await input.press('Enter')
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.reload()
  await expect(page.getByRole('article')).toHaveCount(2)
  await page.getByRole('button', { name: '백엔드 (0)', exact: true }).click()
  await expect(page.getByText('이 카테고리에는 질문이 없습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: '면접 시작', exact: true })).toBeDisabled()

  await page.getByRole('button', { name: '프론트엔드 (1)', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: '면접 시작', exact: true }).click()
  await expect(page).toHaveURL(/\/session$/)
  await expect(page.getByRole('heading', { name: '면접 진행 중' })).toBeVisible()
  await expect(page.getByText('질문 1 / 1', { exact: true })).toBeVisible()
  await expect(page.getByText('React의 상태와 props 차이는?', { exact: true })).toBeVisible()
  await expect(page.getByText('자기소개를 해주세요', { exact: true })).toHaveCount(0)
})

test('375px 화면에서 예시 다운로드 → 파일 미리보기 → 등록', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByText('아직 질문이 없습니다. 위에서 질문을 추가해보세요.')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: '예시 파일 다운로드 (.txt)' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('questions-example.txt')
  const downloadedPath = testInfo.outputPath('questions-example.txt')
  await download.saveAs(downloadedPath)
  expect(await download.failure()).toBeNull()
  const content = await readFile(downloadedPath, 'utf8')
  expect(content).toContain('자기소개를 해주세요.')
  expect(content).toContain('프론트엔드::React의 상태와 props 차이는?')

  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '텍스트 파일 선택' }).click()
  await (await chooserPromise).setFiles(downloadedPath)
  const preview = page.getByRole('region', { name: '파일 미리보기' })
  await expect(preview).toContainText('4개 중 등록 가능 4개 · 중복 0개 · 입력 오류 0개')
  await expect(page.getByRole('article')).toHaveCount(0)
  await page.getByLabel('파일 기본 카테고리').selectOption('행동면접')
  await expect(preview.getByText('1줄 · 행동면접', { exact: true })).toBeVisible()
  await expect(preview.getByText('3줄 · 프론트엔드', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('file-preview-375.png'), fullPage: true })

  await page.getByRole('button', { name: '등록 가능한 4개 추가' }).click()
  await expect(page.getByRole('region', { name: '파일 등록 결과' })).toContainText('4개 중 4개 추가 · 중복 0개 · 입력 오류 0개')
  await expect(page.getByRole('article')).toHaveCount(4)
  await expect(page.getByRole('button', { name: /등록 가능한/ })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('article')).toHaveCount(4)
  await expect(page.getByRole('button', { name: '행동면접 (2)', exact: true })).toBeVisible()
})

// disabled 입력의 초점 처리는 jsdom 대신 실제 브라우저에서 확인한다.
test('Enter 등록 후 연속 입력, 요청 중 이동한 초점은 유지', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('아직 질문이 없습니다. 위에서 질문을 추가해보세요.')).toBeVisible()
  const input = page.getByRole('textbox', { name: '질문 내용' })
  await input.fill('첫 질문')
  await input.press('Enter')
  await expect(page.getByRole('article', { name: '첫 질문' })).toBeVisible()
  await expect(input).toBeFocused()
  await page.keyboard.type('다음 질문')
  await expect(input).toHaveValue('다음 질문')
  await page.evaluate(() => window.__questionMock!.setScenario({ method: 'POST', path: '/api/questions', scenario: 'delay' }))
  await page.keyboard.press('Enter')
  await expect(input).toBeDisabled()
  const filter = page.getByRole('button', { name: '백엔드 (0)', exact: true })
  await filter.click()
  await expect(input).toBeEnabled()
  await expect(filter).toBeFocused()
  await expect(input).toHaveValue('')
})


test('오프라인 Mock 조회·등록은 대기하지 않고 연결 복구 후 재전송하지 않는다', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByText('아직 질문이 없습니다. 위에서 질문을 추가해보세요.')).toBeVisible()
  let registrations = 0
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/questions') registrations++
  })
  const refresh = async () => {
    const response = page.waitForResponse(response =>
      new URL(response.url()).pathname === '/api/questions' && response.request().method() === 'GET',
      { timeout: 5000 },
    )
    await page.getByRole('button', { name: '목록 새로고침' }).click()
    expect((await response).status()).toBe(200)
  }
  const input = page.getByLabel('질문 내용')
  await context.setOffline(true)
  await page.waitForFunction(() => !navigator.onLine)
  await refresh()
  await page.evaluate(() => window.__questionMock!.setScenario({ method: 'POST', path: '/api/questions', scenario: 'error' }))
  await input.fill('오프라인 질문')
  await input.press('Enter')
  await expect(page.getByRole('alert')).toContainText('다시 시도해주세요.')
  await expect(input).toBeEnabled()
  await expect(input).toHaveValue('오프라인 질문')
  expect(registrations).toBe(1)

  await context.setOffline(false)
  await page.waitForFunction(() => navigator.onLine)
  await refresh()
  await expect(page.getByRole('article')).toHaveCount(0)
  expect(registrations).toBe(1)

  await context.setOffline(true)
  await page.waitForFunction(() => !navigator.onLine)
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await expect(page.getByRole('article', { name: '오프라인 질문' })).toBeVisible()
  await expect(input).toBeEnabled()
  expect(registrations).toBe(2)
  await context.setOffline(false)
  await page.waitForFunction(() => navigator.onLine)
  await refresh()
  await expect(page.getByRole('article')).toHaveCount(1)
  expect(registrations).toBe(2)
})
