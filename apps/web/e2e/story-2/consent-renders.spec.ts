import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-1: ConsentModal renders for user with consentGiven: false
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-1: ConsentModal renders for new authenticated user', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should render ConsentModal with all required elements when consentGiven is false', async ({
    page,
    request,
  }) => {
    const email = 'newuser@example.com'
    const password = 'password123'
    await createEmulatorUser(request, email, password)

    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    await signInViaTestHelper(page, email, password)

    // New user → consentGiven: false → routed to /consent
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    // Modal root
    await expect(page.getByTestId('consent-modal')).toBeVisible()

    // Title
    await expect(page.getByTestId('consent-title')).toHaveText('Before we begin')

    // Checkbox (unchecked by default)
    await expect(page.getByTestId('consent-checkbox')).toBeVisible()
    await expect(page.getByTestId('consent-checkbox')).not.toBeChecked()

    // Submit button
    await expect(page.getByTestId('consent-submit-btn')).toBeVisible()
    await expect(page.getByTestId('consent-submit-btn')).toHaveText('I Agree & Continue')

    // Privacy Policy link
    await expect(page.getByTestId('consent-privacy-link')).toBeVisible()
    await expect(page.getByTestId('consent-privacy-link')).toHaveText('Privacy Policy')

    // Required data disclosure items
    await expect(page.getByTestId('consent-modal')).toContainText('Your name and email')
    await expect(page.getByTestId('consent-modal')).toContainText(
      'Your child\'s name and date of birth',
    )
    await expect(page.getByTestId('consent-modal')).toContainText('watch time data')
    await expect(page.getByTestId('consent-modal')).toContainText('device token')

    // Sign-in screen no longer visible
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible()
  })
})
