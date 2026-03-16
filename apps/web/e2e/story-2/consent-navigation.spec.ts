import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-5: On confirm — navigates to /profile (Child Profile Setup)
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-5: Navigation to /profile on consent confirm', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should navigate to /profile after confirming consent', async ({ page, request }) => {
    const email = 'navigate@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    await page.getByTestId('consent-checkbox').click()
    await page.getByTestId('consent-submit-btn').click()

    await expect(page).toHaveURL('/profile', { timeout: 10000 })
    await expect(page.getByTestId('profile-screen')).toBeVisible()
    await expect(page.getByTestId('consent-modal')).not.toBeVisible()
  })
})
