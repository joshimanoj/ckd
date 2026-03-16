import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-5: Sign-out clears session and returns to Sign In
 * Requires: Firebase emulator
 */
test.describe('FT-5: Sign-out clears session and returns to Sign In', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should return to / with sign-in screen after sign out', async ({ page, request }) => {
    const email = 'signout@example.com'
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')

    // Should be at /library after sign-in
    await expect(page).toHaveURL('/library', { timeout: 10000 })

    // Trigger sign-out via exposed test helper
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>)['__signOut'] === 'function',
      { timeout: 5000 },
    )
    await page.evaluate(() =>
      (window as unknown as { __signOut: () => Promise<void> }).__signOut(),
    )

    await expect(page).toHaveURL('/', { timeout: 8000 })
    await expect(page.getByTestId('sign-in-screen')).toBeVisible()
  })
})
