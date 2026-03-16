import { test, expect } from '@playwright/test'

/**
 * FT-5: Sign-out clears session and returns to Sign In
 * Requires: Firebase emulator
 */
test.describe('FT-5: Sign-out clears session and returns to Sign In', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: firebase emulators:start'
  )

  test('should return to / with sign-in screen after sign out', async ({ page }) => {
    // Sign in and navigate to /library
    await page.goto('/library')
    await expect(page).toHaveURL('/library', { timeout: 8000 })

    // Trigger sign out via exposed test hook
    await page.evaluate(() => {
      return (window as { __signOut?: () => Promise<void> }).__signOut?.()
    })

    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible()
  })
})
