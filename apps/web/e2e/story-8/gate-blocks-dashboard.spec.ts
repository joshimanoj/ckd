import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 8 — FT-1: Dashboard accessible only after Parental Gate', () => {
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

  test('FT-1a: parent-panel not visible on library load', async ({ page, request }) => {
    await setup(page, request, 'ft1a-s8')
    await expect(page.getByTestId('parent-panel')).not.toBeVisible()
    await expect(page.getByTestId('parental-gate-modal')).not.toBeVisible()
  })

  test('FT-1b: gate appears on parent icon tap; panel still hidden', async ({ page, request }) => {
    await setup(page, request, 'ft1b-s8')
    await page.getByTestId('parent-icon-btn').click()
    await expect(page.getByTestId('parental-gate-modal')).toBeVisible()
    await expect(page.getByTestId('parent-panel')).not.toBeVisible()
  })

  test('FT-1c: dismissing gate without solving keeps panel hidden', async ({ page, request }) => {
    await setup(page, request, 'ft1c-s8')
    await page.getByTestId('parent-icon-btn').click()
    await expect(page.getByTestId('parental-gate-modal')).toBeVisible()
    await page.getByTestId('gate-dismiss-btn').click()
    await expect(page.getByTestId('parental-gate-modal')).not.toBeVisible()
    await expect(page.getByTestId('parent-panel')).not.toBeVisible()
  })

  test('FT-1d: correct answer reveals panel with dashboard-screen inside', async ({ page, request }) => {
    await setup(page, request, 'ft1d-s8')
    await page.getByTestId('parent-icon-btn').click()
    await solveGate(page)
    await expect(page.getByTestId('parental-gate-modal')).not.toBeVisible()
    await expect(page.getByTestId('parent-panel')).toBeVisible({ timeout: 5000 })
    // No sessions seeded → DashboardScreen renders empty state (still confirms dashboard loaded)
    await expect(page.getByTestId('dashboard-empty-state')).toBeVisible({ timeout: 8000 })
  })
})
