import type { APIRequestContext, Page } from '@playwright/test'

const AUTH = 'http://127.0.0.1:9099'
const FIRESTORE = 'http://127.0.0.1:8080'
const PROJECT = 'ckd-test'
const TEST_PASSWORD = 'password123'

export async function clearEmulatorData(request: APIRequestContext) {
  // Note: the Auth emulator's bulk-delete endpoint (/emulator/v1/.../accounts) returns 200
  // but does not reliably clear accounts in all emulator versions. We attempt it and fall
  // back gracefully — createEmulatorUser handles EMAIL_EXISTS by signing in instead.
  await request.delete(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`)
  await request.delete(
    `${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
  )
}

export async function createEmulatorUser(
  request: APIRequestContext,
  email: string,
  password: string = TEST_PASSWORD,
): Promise<string> {
  const signUpRes = await request.post(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-key`,
    { data: { email, password, returnSecureToken: true } },
  )
  const signUpBody = (await signUpRes.json()) as {
    localId?: string
    error?: { message?: string }
  }

  if (signUpBody.localId) return signUpBody.localId

  // The Auth emulator bulk-delete may not actually remove accounts.
  // When the same email already exists across test runs, fall back to sign-in.
  if (signUpBody.error?.message === 'EMAIL_EXISTS') {
    const signInRes = await request.post(
      `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-key`,
      { data: { email, password, returnSecureToken: true } },
    )
    const signInBody = (await signInRes.json()) as { localId: string }
    return signInBody.localId
  }

  throw new Error(`createEmulatorUser failed: ${JSON.stringify(signUpBody)}`)
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

export interface SeedVideoInput {
  id: string
  title: string
  category?: string
  publishedAt?: string   // ISO string, e.g. '2026-01-01T00:00:00Z'
  isActive?: boolean
  order?: number
  youtubeVideoId?: string
  thumbnailUrl?: string
  durationSeconds?: number
}

export async function seedVideo(request: APIRequestContext, video: SeedVideoInput) {
  const {
    id,
    title,
    category = 'Rhymes',
    publishedAt = '2026-01-01T00:00:00Z',
    isActive = true,
    order = 1,
    youtubeVideoId = 'dQw4w9WgXcQ',
    thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId ?? 'dQw4w9WgXcQ'}/0.jpg`,
    durationSeconds = 180,
  } = video
  await request.patch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/videos/${id}`,
    {
      data: {
        fields: {
          youtubeVideoId: { stringValue: youtubeVideoId },
          title: { stringValue: title },
          category: { stringValue: category },
          thumbnailUrl: { stringValue: thumbnailUrl },
          durationSeconds: { integerValue: String(durationSeconds) },
          publishedAt: { timestampValue: publishedAt },
          isActive: { booleanValue: isActive },
          order: { integerValue: String(order) },
        },
      },
    },
  )
}

export async function seedVideos(request: APIRequestContext, videos: SeedVideoInput[]) {
  await Promise.all(videos.map((v) => seedVideo(request, v)))
}

export async function setAdminClaim(request: APIRequestContext, uid: string): Promise<void> {
  await request.post(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:update`,
    {
      headers: { Authorization: 'Bearer owner' },
      data: { localId: uid, customAttributes: JSON.stringify({ admin: true }) },
    },
  )
}

export async function getFirestoreDocument(
  request: APIRequestContext,
  collection: string,
  docId: string,
): Promise<{ fields: Record<string, Record<string, unknown>> }> {
  const res = await request.get(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`,
  )
  return (await res.json()) as { fields: Record<string, Record<string, unknown>> }
}

export async function listFirestoreCollection(
  request: APIRequestContext,
  collection: string,
): Promise<Array<{ name: string; fields: Record<string, Record<string, unknown>> }>> {
  const res = await request.get(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}`,
  )
  const body = (await res.json()) as {
    documents?: Array<{ name: string; fields: Record<string, Record<string, unknown>> }>
  }
  return body.documents ?? []
}

export async function patchFirestoreDocument(
  request: APIRequestContext,
  collection: string,
  docId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await request.patch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`,
    { data: { fields } },
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
