import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-2: Google Sign-In flow + Firestore user document created
 * Requires: Firebase Auth + Firestore emulators running
 */
test.describe('FT-2: Google Sign-In flow + Firestore user doc', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('should create Firestore user doc with correct defaults after sign-in', async ({
    page,
    request,
  }) => {
    const email = 'newuser@example.com'
    const password = 'password123'
    const uid = await createEmulatorUser(request, email, password)

    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    await signInViaTestHelper(page, email, password)

    // App should redirect to /consent (first-time user, consentGiven: false)
    await expect(page).toHaveURL('/consent', { timeout: 10000 })

    // Verify Firestore user doc was created with correct defaults
    const docRes = await request.get(
      `http://127.0.0.1:8080/v1/projects/ckd-test/databases/(default)/documents/users/${uid}`,
    )
    expect(docRes.ok()).toBeTruthy()
    const doc = (await docRes.json()) as {
      fields: Record<
        string,
        { booleanValue?: boolean; nullValue?: string; stringValue?: string }
      >
    }
    expect(doc.fields['consentGiven']?.booleanValue).toBe(false)
    expect(doc.fields['notificationsEnabled']?.booleanValue).toBe(false)
    expect(doc.fields['fcmToken']?.nullValue).toBe(null)
    expect(doc.fields['uid']?.stringValue).toBe(uid)
  })
})
