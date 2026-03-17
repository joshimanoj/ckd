import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 8 — FT-7: Parent panel side drawer opens and closes', () => {
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

  async function openPanel(page: Page) {
    await page.getByTestId('parent-icon-btn').click()
    const questionText = await page.getByTestId('gate-question').textContent()
    const match = questionText!.match(/(\d+) ([+\u2212]) (\d+)/)
    expect(match).not.toBeNull()
    const a = parseInt(match![1])
    const op = match![2]
    const b = parseInt(match![3])
    const answer = op === '+' ? a + b : a - b
    await page.getByTestId('gate-answer-input').fill(String(answer))
    await page.getByTestId('gate-confirm-btn').click()
    await expect(page.getByTestId('parent-panel')).toBeVisible({ timeout: 5000 })
  }

  test('FT-7a: panel opens after solving gate', async ({ page, request }) => {
    await setup(page, request, 'ft7a-s8')
    await openPanel(page)
    await expect(page.getByTestId('parent-panel')).toBeVisible()
    await expect(page.getByTestId('dashboard-screen')).toBeVisible()
  })

  test('FT-7b: close button hides the panel', async ({ page, request }) => {
    await setup(page, request, 'ft7b-s8')
    await openPanel(page)
    await page.getByTestId('panel-close-btn').click()
    await expect(page.getByTestId('parent-panel')).not.toBeVisible({ timeout: 3000 })
    await expect(page.getByTestId('library-screen')).toBeVisible()
  })

  test('FT-7c: clicking overlay closes the panel', async ({ page, request }) => {
    await setup(page, request, 'ft7c-s8')
    await openPanel(page)
    // Click the overlay (top-left corner — outside the drawer panel)
    await page.getByTestId('panel-overlay').click({ position: { x: 10, y: 10 } })
    await expect(page.getByTestId('parent-panel')).not.toBeVisible({ timeout: 3000 })
  })

  test('FT-7d: panel can be reopened after closing', async ({ page, request }) => {
    await setup(page, request, 'ft7d-s8')
    await openPanel(page)
    await page.getByTestId('panel-close-btn').click()
    await expect(page.getByTestId('parent-panel')).not.toBeVisible({ timeout: 3000 })
    // Reopen
    await openPanel(page)
    await expect(page.getByTestId('parent-panel')).toBeVisible()
  })
})
