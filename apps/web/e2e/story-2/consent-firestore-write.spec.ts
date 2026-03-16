import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

const FIRESTORE = 'http://127.0.0.1:8080'
const PROJECT = 'ckd-test'

/**
 * FT-4: On confirm — Firestore consentGiven:true + consentTimestamp written
 * Requires: Firebase emulator (Auth + Firestore)
 */
test.describe('FT-4: Firestore consent write on confirm', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should write consentGiven:true and consentTimestamp to Firestore on confirm', async ({
    page,
    request,
  }) => {
    const email = 'consent-write@example.com'
    const password = 'password123'
    const uid = await createEmulatorUser(request, email, password)

    await page.goto('/')
    await signInViaTestHelper(page, email, password)
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    await page.getByTestId('consent-checkbox').click()
    await page.getByTestId('consent-submit-btn').click()

    // Wait for navigation to /profile
    await expect(page).toHaveURL('/profile', { timeout: 10000 })

    // Verify Firestore document via emulator REST API
    const docRes = await request.get(
      `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}`,
    )
    expect(docRes.ok()).toBeTruthy()

    const doc = (await docRes.json()) as {
      fields: Record<string, { booleanValue?: boolean; nullValue?: string; timestampValue?: string }>
    }

    expect(doc.fields['consentGiven']?.booleanValue).toBe(true)
    // serverTimestamp() resolves to a timestampValue — not nullValue
    expect(doc.fields['consentTimestamp']?.timestampValue).toBeTruthy()
  })
})
