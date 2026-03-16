import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

const FIRESTORE = 'http://127.0.0.1:8080'
const PROJECT = 'ckd-test'

/**
 * FT-6: Firestore write failure — error toast shown, modal stays open
 * Requires: Firebase emulator (Auth + Firestore)
 *
 * Strategy: delete the user doc via emulator REST API after the page reaches /consent.
 * updateDoc on a non-existent document throws NOT_FOUND, which Firebase SDK propagates
 * as a Promise rejection — triggering the catch block in ConsentModal.
 */
test.describe('FT-6: Error state on Firestore write failure', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should show error toast and keep modal open when Firestore write fails', async ({
    page,
    request,
  }) => {
    const email = 'error-state@example.com'
    const password = 'password123'
    const uid = await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)

    // Wait for /consent — createUserDoc has run and the user doc exists
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    // Delete the user document so that updateDoc (which requires the doc to exist)
    // throws NOT_FOUND. The AuthGuard won't re-route because the auth state is unchanged.
    await request.delete(
      `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}`,
    )

    await page.getByTestId('consent-checkbox').click()
    await page.getByTestId('consent-submit-btn').click()

    // Error toast must appear
    await expect(page.getByTestId('consent-error-toast')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('consent-error-toast')).toContainText(
      'Something went wrong. Please try again.',
    )

    // Modal stays open — no navigation
    await expect(page).toHaveURL('/consent')
    await expect(page.getByTestId('consent-modal')).toBeVisible()
  })
})
