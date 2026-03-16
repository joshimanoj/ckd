import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-3: Checkbox unchecked by default; button disabled until checked
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-3: Checkbox gating on ConsentModal', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should start with checkbox unchecked and button disabled, then enable on check', async ({
    page,
    request,
  }) => {
    const email = 'gating@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    // Initial state: unchecked + disabled
    await expect(page.getByTestId('consent-checkbox')).not.toBeChecked()
    await expect(page.getByTestId('consent-submit-btn')).toBeDisabled()

    // Check the checkbox
    await page.getByTestId('consent-checkbox').click()
    await expect(page.getByTestId('consent-checkbox')).toBeChecked()
    await expect(page.getByTestId('consent-submit-btn')).toBeEnabled()

    // Uncheck again → button disabled again
    await page.getByTestId('consent-checkbox').click()
    await expect(page.getByTestId('consent-checkbox')).not.toBeChecked()
    await expect(page.getByTestId('consent-submit-btn')).toBeDisabled()
  })
})
