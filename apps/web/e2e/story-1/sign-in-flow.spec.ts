import { test, expect } from '@playwright/test'

/**
 * FT-2: Google Sign-In popup flow + Firestore user document created
 * Requires: Firebase Auth + Firestore emulators running
 */
test.describe('FT-2: Google Sign-In popup flow + Firestore user doc', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: firebase emulators:start'
  )

  test('should create Firestore user doc with correct defaults after sign-in', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 })

    // Simulate Google Sign-In via emulator REST API
    const response = await page.request.post(
      'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=test-key',
      {
        data: {
          postBody: 'providerId=google.com&id_token=test-token',
          requestUri: 'http://localhost',
          returnSecureToken: true,
          returnIdpCredential: true,
        },
      }
    )
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    const uid = body.localId as string

    // App should redirect away from /
    await expect(page).not.toHaveURL('/', { timeout: 5000 })

    // Verify Firestore user doc
    const docResponse = await page.request.get(
      `http://127.0.0.1:8080/v1/projects/ckd-test/databases/(default)/documents/users/${uid}`
    )
    expect(docResponse.ok()).toBeTruthy()
    const doc = await docResponse.json()
    const fields = doc.fields as Record<string, { booleanValue?: boolean; nullValue?: string }>
    expect(fields['consentGiven']?.booleanValue).toBe(false)
    expect(fields['notificationsEnabled']?.booleanValue).toBe(false)
    expect(fields['fcmToken']?.nullValue).toBe('NULL_VALUE')
  })
})
