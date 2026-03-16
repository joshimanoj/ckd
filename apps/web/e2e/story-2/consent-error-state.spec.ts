import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-6: Firestore write failure — error toast shown, modal stays open
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-6: Error state on Firestore write failure', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should show error toast and keep modal open when Firestore write fails', async ({
    page,
    request,
  }) => {
    const email = 'error-state@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)

    // Wait for /consent — all initial reads (createUserDoc, getUserDoc) have completed
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    // Intercept only PATCH requests (updateDoc from recordConsent) and return 500
    // Initial writes use PUT (setDoc) — those are already done by this point
    await page.route('**/databases/(default)/documents/users/**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Internal error' } }),
        })
      } else {
        await route.continue()
      }
    })

    await page.getByTestId('consent-checkbox').click()
    await page.getByTestId('consent-submit-btn').click()

    // Error toast must appear
    await expect(page.getByTestId('consent-error-toast')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('consent-error-toast')).toContainText(
      'Something went wrong. Please try again.',
    )

    // Modal stays open — no navigation
    await expect(page).toHaveURL('/consent')
    await expect(page.getByTestId('consent-modal')).toBeVisible()
  })
})
