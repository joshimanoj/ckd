import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-3: First-time user routed to Consent Modal
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-3: First-time user routed to Consent Modal', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should route to /consent when consentGiven is false (new user)', async ({
    page,
    request,
  }) => {
    const email = 'firsttime@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    await signInViaTestHelper(page, email, password)

    // New user: createUserDoc writes consentGiven: false → route to /consent
    await expect(page).toHaveURL('/consent', { timeout: 10000 })
    await expect(page.getByTestId('consent-modal')).toBeVisible()
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible()
  })
})
