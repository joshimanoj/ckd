import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 8 — FT-3: Empty state when no watch sessions', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-8/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setup(page: Page, request: APIRequestContext, emailPrefix: string) {
    const email = `${emailPrefix}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)
    // No watch sessions seeded
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
    await page.getByTestId('gate-confirm-btn').click()
  }

  test('FT-3a: empty state shown when child has no sessions', async ({ page, request }) => {
    await setup(page, request, 'ft3a-s8')
    await page.getByTestId('parent-icon-btn').click()
    await solveGate(page)
    await expect(page.getByTestId('parent-panel')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('dashboard-empty-state')).toBeVisible({ timeout: 8000 })
  })

  test('FT-3b: data elements not visible in empty state', async ({ page, request }) => {
    await setup(page, request, 'ft3b-s8')
    await page.getByTestId('parent-icon-btn').click()
    await solveGate(page)
    await expect(page.getByTestId('dashboard-empty-state')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('today-value')).not.toBeVisible()
    await expect(page.getByTestId('watch-time-chart')).not.toBeVisible()
  })
})
