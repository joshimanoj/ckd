import { test, expect } from '@playwright/test'

/**
 * FT-4: Returning authenticated user bypasses Sign In + routed correctly
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-4: Returning authenticated user bypasses Sign In', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: firebase emulators:start'
  )

  test('consentGiven: true + child profile → routes to /library', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible({ timeout: 8000 })
    await expect(page).toHaveURL('/library')
  })

  test('consentGiven: true + no child profile → routes to /profile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible({ timeout: 8000 })
    await expect(page).toHaveURL('/profile')
  })

  test('consentGiven: false → routes to /consent', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible({ timeout: 8000 })
    await expect(page).toHaveURL('/consent')
  })
})
