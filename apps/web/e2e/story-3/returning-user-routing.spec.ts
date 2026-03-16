import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('FT-7: Returning user with profile routes to /library', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('consentGiven: true + child profile exists → routes to /library, not /profile', async ({
    page,
    request,
  }) => {
    const email = `returning-${Date.now()}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')

    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await expect(page.getByTestId('library-screen')).toBeVisible()
    await expect(page.getByTestId('child-profile-screen')).not.toBeVisible()
  })
})
