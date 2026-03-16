import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-1: Screen renders at /profile when consentGiven: true + no child profiles
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-1: Child Profile screen renders', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should render child profile screen when consentGiven: true and no profiles exist', async ({
    page,
    request,
  }) => {
    const email = 'profile-render@example.com'
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')

    await expect(page).toHaveURL('/profile', { timeout: 10000 })
    await expect(page.getByTestId('child-profile-screen')).toBeVisible()
    await expect(page.getByText("Who's watching?")).toBeVisible()
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('pill-under-3')).toBeVisible()
    await expect(page.getByTestId('pill-3-4')).toBeVisible()
    await expect(page.getByTestId('pill-5-6')).toBeVisible()
    await expect(page.getByTestId('start-watching-btn')).toBeVisible()
    await expect(page.getByTestId('start-watching-btn')).toBeDisabled()
  })

  test('should render top navigation bar', async ({ page, request }) => {
    const email = 'profile-nav@example.com'
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')

    await expect(page).toHaveURL('/profile', { timeout: 10000 })
    await expect(page.getByTestId('top-nav')).toBeVisible()
  })
})
