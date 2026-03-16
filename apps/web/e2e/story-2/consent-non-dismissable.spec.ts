import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-2: Modal is non-dismissable (backdrop click, Escape, back button)
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-2: ConsentModal is non-dismissable', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should stay on /consent when backdrop is clicked', async ({ page, request }) => {
    const email = 'backdrop@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    // Click the overlay area (the modal root — outside the card)
    await page.getByTestId('consent-modal').click({ position: { x: 5, y: 5 } })

    await expect(page).toHaveURL('/consent')
    await expect(page.getByTestId('consent-modal')).toBeVisible()
  })

  test('should stay on /consent when Escape is pressed', async ({ page, request }) => {
    const email = 'escape@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    await page.keyboard.press('Escape')

    await expect(page).toHaveURL('/consent')
    await expect(page.getByTestId('consent-modal')).toBeVisible()
  })

  test('should redirect back to /consent when browser back is pressed', async ({
    page,
    request,
  }) => {
    const email = 'backbutton@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    await page.goBack()

    // AuthGuard re-evaluates: consentGiven still false → redirect back to /consent
    await expect(page).toHaveURL('/consent', { timeout: 10000 })
    await expect(page.getByTestId('consent-modal')).toBeVisible()
  })
})
