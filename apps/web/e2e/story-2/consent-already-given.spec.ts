import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-7: User with consentGiven:true bypasses /consent entirely
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-7: Already-consented user bypasses /consent', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should route to /profile (not /consent) when consentGiven is true and no child profile', async ({
    page,
    request,
  }) => {
    const email = 'returning@example.com'
    const password = 'password123'
    const uid = await createEmulatorUser(request, email, password)

    // Seed user doc with consentGiven: true, no child profile
    await seedUserDoc(request, uid, true)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)

    // Should land on /profile (has consent, no child profile)
    await expect(page).toHaveURL('/profile', { timeout: 10000 })
    await expect(page.getByTestId('child-profile-screen')).toBeVisible()

    // Consent modal must NOT appear
    await expect(page.getByTestId('consent-modal')).not.toBeVisible()
  })
})
