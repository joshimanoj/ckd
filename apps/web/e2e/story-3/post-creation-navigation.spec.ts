import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('FT-6: Navigate to /library after profile creation', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('filling form and submitting navigates to /library', async ({ page, request }) => {
    const email = `nav-${Date.now()}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/profile', { timeout: 10000 })

    await page.getByTestId('name-input').fill('Priya')
    await page.getByTestId('pill-5-6').click()
    await page.getByTestId('start-watching-btn').click()

    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await expect(page.getByTestId('library-screen')).toBeVisible()
  })
})
