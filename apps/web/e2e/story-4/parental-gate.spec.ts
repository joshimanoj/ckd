import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 4 — Parental Gate', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupAndNavigateToLibrary(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    emailPrefix: string,
  ) {
    const email = `${emailPrefix}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
  }

  test('FT-1: Parent icon visible on library screen, gate modal not open', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToLibrary(page, request, 'ft1-gate')
    await expect(page.getByTestId('library-screen')).toBeVisible()
    await expect(page.getByTestId('parent-icon-btn')).toBeVisible()
    await expect(page.getByTestId('parental-gate')).not.toBeVisible()
  })

  test('FT-2: Tapping parent icon opens gate modal with math question', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToLibrary(page, request, 'ft2-gate')
    await page.getByTestId('parent-icon-btn').click()
    await expect(page.getByTestId('parental-gate')).toBeVisible()
    await expect(page.getByTestId('gate-question')).toBeVisible()
    await expect(page.getByTestId('gate-question')).toHaveText(/\d+ [+−] \d+ = \?/)
    await expect(page.getByTestId('gate-dismiss-btn')).toBeVisible()
    await expect(page.getByTestId('gate-answer-input')).toBeVisible()
    await expect(page.getByTestId('gate-submit-btn')).toBeVisible()
  })

  test('FT-3: Confirm button disabled when answer field is empty', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToLibrary(page, request, 'ft3-gate')
    await page.getByTestId('parent-icon-btn').click()
    await expect(page.getByTestId('gate-submit-btn')).toBeDisabled()
    await page.getByTestId('gate-answer-input').fill('5')
    await expect(page.getByTestId('gate-submit-btn')).not.toBeDisabled()
    await page.getByTestId('gate-answer-input').clear()
    await expect(page.getByTestId('gate-submit-btn')).toBeDisabled()
  })

  test('FT-4: Wrong answer clears input, new question generated, modal stays open', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToLibrary(page, request, 'ft4-gate')
    await page.getByTestId('parent-icon-btn').click()
    const firstQuestion = await page.getByTestId('gate-question').textContent()
    await page.getByTestId('gate-answer-input').fill('99')
    await page.getByTestId('gate-submit-btn').click()
    await expect(page.getByTestId('gate-answer-input')).toHaveValue('')
    await expect(page.getByTestId('parental-gate')).toBeVisible()
    const newQuestion = await page.getByTestId('gate-question').textContent()
    expect(newQuestion).not.toBe(firstQuestion)
    await expect(page.getByTestId('parent-panel')).not.toBeVisible()
  })

  test('FT-5: Correct answer closes modal and reveals parent panel', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToLibrary(page, request, 'ft5-gate')
    await page.getByTestId('parent-icon-btn').click()
    const questionText = await page.getByTestId('gate-question').textContent()
    // Parse "A + B = ?" or "A − B = ?"
    const match = questionText!.match(/(\d+) ([+\u2212]) (\d+)/)
    expect(match).not.toBeNull()
    const a = parseInt(match![1])
    const op = match![2]
    const b = parseInt(match![3])
    const answer = op === '+' ? a + b : a - b
    await page.getByTestId('gate-answer-input').fill(String(answer))
    await page.getByTestId('gate-submit-btn').click()
    await expect(page.getByTestId('parental-gate')).not.toBeVisible()
    await expect(page.getByTestId('parent-panel')).toBeVisible()
  })

  test('FT-6: X button closes modal, parent panel not shown', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToLibrary(page, request, 'ft6-gate')
    await page.getByTestId('parent-icon-btn').click()
    await expect(page.getByTestId('parental-gate')).toBeVisible()
    await page.getByTestId('gate-dismiss-btn').click()
    await expect(page.getByTestId('parental-gate')).not.toBeVisible()
    await expect(page.getByTestId('parent-panel')).not.toBeVisible()
    await expect(page.getByTestId('library-screen')).toBeVisible()
  })
})
