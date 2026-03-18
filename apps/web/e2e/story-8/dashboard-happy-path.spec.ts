import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfileWithId,
  seedWatchSession,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 8 — FT-2: Dashboard happy path (today + chart + monthly)', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-8/',
  )

  const CHILD_ID = 'test-child-001'

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setup(page: Page, request: APIRequestContext, emailPrefix: string) {
    const email = `${emailPrefix}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfileWithId(request, uid, CHILD_ID)

    // Today: 2700s (45 min)
    const todayStart = new Date()
    todayStart.setHours(10, 0, 0, 0)
    await seedWatchSession(request, uid, CHILD_ID, {
      sessionId: 'sess-today-1',
      watchedSeconds: 2700,
      startTime: todayStart.toISOString(),
    })

    // Yesterday: 1800s
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(14, 0, 0, 0)
    await seedWatchSession(request, uid, CHILD_ID, {
      sessionId: 'sess-yesterday-1',
      watchedSeconds: 1800,
      startTime: yesterday.toISOString(),
    })

    // Earlier this week (but not today): 3600s
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 2)
    thisWeek.setHours(9, 0, 0, 0)
    await seedWatchSession(request, uid, CHILD_ID, {
      sessionId: 'sess-week-1',
      watchedSeconds: 3600,
      startTime: thisWeek.toISOString(),
    })

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
  }

  async function solveGate(page: Page) {
    const questionText = await page.getByTestId('gate-question').textContent()
    const match = questionText!.match(/(\d+) ([+\u2212]) (\d+)/)
    expect(match).not.toBeNull()
    const a = parseInt(match![1])
    const op = match![2]
    const b = parseInt(match![3])
    const answer = op === '+' ? a + b : a - b
    await page.getByTestId('gate-answer-input').fill(String(answer))
    await page.getByTestId('gate-submit-btn').click()
  }

  test('FT-2a: today total shown as "45 min"', async ({ page, request }) => {
    await setup(page, request, 'ft2a-s8')
    await page.getByTestId('parent-icon').click()
    await solveGate(page)
    await expect(page.getByTestId('parent-panel')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('today-value')).toHaveText('45 min', { timeout: 8000 })
  })

  test('FT-2b: weekly chart shows 7 bars', async ({ page, request }) => {
    await setup(page, request, 'ft2b-s8')
    await page.getByTestId('parent-icon').click()
    await solveGate(page)
    await expect(page.getByTestId('watch-time-chart')).toBeVisible({ timeout: 8000 })
    const bars = await page.getByTestId('chart-bar').count()
    expect(bars).toBe(7)
  })

  test('FT-2c: monthly total is visible and non-empty', async ({ page, request }) => {
    await setup(page, request, 'ft2c-s8')
    await page.getByTestId('parent-icon').click()
    await solveGate(page)
    await expect(page.getByTestId('monthly-total')).toBeVisible({ timeout: 8000 })
    const text = await page.getByTestId('monthly-total').textContent()
    expect(text).toBeTruthy()
    expect(text!.length).toBeGreaterThan(0)
  })

  test('FT-2d: empty state is NOT shown when sessions exist', async ({ page, request }) => {
    await setup(page, request, 'ft2d-s8')
    await page.getByTestId('parent-icon').click()
    await solveGate(page)
    await expect(page.getByTestId('today-value')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('dashboard-empty-state')).not.toBeVisible()
  })
})
