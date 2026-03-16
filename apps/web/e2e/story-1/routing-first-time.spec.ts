import { test, expect } from '@playwright/test'

/**
 * FT-3: First-time user routed to Consent Modal
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-3: First-time user routed to Consent Modal', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: firebase emulators:start'
  )

  test('should route to /consent when consentGiven is false', async ({ page }) => {
    // Sign in via emulator with consentGiven: false
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    // After sign-in, app reads consentGiven: false → routes to /consent
    await expect(page).toHaveURL('/consent', { timeout: 8000 })
    await expect(page.getByTestId('consent-modal')).toBeVisible()
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible()
  })
})
