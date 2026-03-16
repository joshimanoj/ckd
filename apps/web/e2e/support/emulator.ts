import type { APIRequestContext, Page } from '@playwright/test'

const AUTH = 'http://127.0.0.1:9099'
const FIRESTORE = 'http://127.0.0.1:8080'
const PROJECT = 'ckd-test'

export async function clearEmulatorData(request: APIRequestContext) {
  await request.delete(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`)
  await request.delete(
    `${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
  )
}

export async function createEmulatorUser(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-key`,
    { data: { email, password, returnSecureToken: true } },
  )
  const body = (await res.json()) as { localId: string }
  return body.localId
}

export async function seedUserDoc(
  request: APIRequestContext,
  uid: string,
  consentGiven: boolean,
) {
  await request.patch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}`,
    {
      data: {
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: 'test@example.com' },
          displayName: { stringValue: 'Test User' },
          fcmToken: { nullValue: 'NULL_VALUE' },
          notificationsEnabled: { booleanValue: false },
          consentGiven: { booleanValue: consentGiven },
          consentTimestamp: { nullValue: 'NULL_VALUE' },
          createdAt: { timestampValue: '2026-01-01T00:00:00Z' },
        },
      },
    },
  )
}

export async function seedChildProfile(request: APIRequestContext, uid: string) {
  await request.post(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/childProfiles`,
    { data: { fields: { name: { stringValue: 'Test Child' } } } },
  )
}

export async function signInViaTestHelper(page: Page, email: string, password: string) {
  await page.waitForFunction(
    () =>
      typeof (window as unknown as Record<string, unknown>)['__testSignIn'] === 'function',
    { timeout: 5000 },
  )
  await page.evaluate(
    ({ e, p }) =>
      (
        window as unknown as {
          __testSignIn: (e: string, p: string) => Promise<unknown>
        }
      ).__testSignIn(e, p),
    { e: email, p: password },
  )
}
