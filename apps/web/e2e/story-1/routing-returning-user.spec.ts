import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-4: Returning authenticated user bypasses Sign In + routed correctly
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-4: Returning authenticated user bypasses Sign In', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('consentGiven: true + child profile → routes to /library', async ({ page, request }) => {
    const email = 'returning1@example.com'
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')

    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible()
  })

  test('consentGiven: true + no child profile → routes to /profile', async ({ page, request }) => {
    const email = 'returning2@example.com'
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')

    await expect(page).toHaveURL('/profile', { timeout: 10000 })
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible()
  })

  test('consentGiven: false → routes to /consent', async ({ page, request }) => {
    const email = 'returning3@example.com'
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, false)

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')

    await expect(page).toHaveURL('/consent', { timeout: 10000 })
    await expect(page.getByTestId('sign-in-screen')).not.toBeVisible()
  })
})
