import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('FT-8: Firestore write failure shows error toast', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('shows error toast and stays on /profile when write fails', async ({ page, request }) => {
    const email = `write-fail-${Date.now()}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/profile', { timeout: 10000 })

    // Inject test failure flag before submitting
    await page.evaluate(() => {
      ;(window as unknown as Record<string, unknown>)['__TEST_FAIL_PROFILE_WRITE'] = true
    })

    await page.getByTestId('name-input').fill('Arjun')
    await page.getByTestId('pill-under-3').click()
    await page.getByTestId('start-watching-btn').click()

    await expect(page.getByTestId('error-toast')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('error-toast')).toContainText("Couldn't save profile. Try again.")
    await expect(page).toHaveURL('/profile')
    await expect(page.getByTestId('start-watching-btn')).not.toBeDisabled()
  })
})
