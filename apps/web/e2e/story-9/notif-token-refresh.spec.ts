import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedChildProfileWithId,
  signInViaTestHelper,
  getFirestoreDocument,
  patchFirestoreDocument,
} from '../support/emulator'

const REFRESHED_TOKEN = 'refreshed-token-ft4-002'

/**
 * FT-4: FCM token written/refreshed on app mount when permission granted
 *
 * Criterion: FCM token refreshed on each app open (token may rotate).
 */
test.describe('Story 9 — FT-4: FCM token refreshed on app mount when permission granted', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-9/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('FT-4: updates fcmToken in Firestore when token rotates on mount', async ({
    page,
    request,
    context,
  }) => {
    await context.grantPermissions(['notifications'])

    // Inject new (rotated) token before page load
    await page.addInitScript((token: string) => {
      ;(window as unknown as Record<string, unknown>)['__mockFcmToken'] = token
    }, REFRESHED_TOKEN)

    const uid = await createEmulatorUser(request, 'ft4-notif@example.com')

    // Seed user doc with old token and notificationsEnabled: true
    await patchFirestoreDocument(request, 'users', uid, {
      uid: { stringValue: uid },
      email: { stringValue: 'ft4-notif@example.com' },
      displayName: { stringValue: 'Test User' },
      fcmToken: { stringValue: 'old-token-ft4-001' },
      notificationsEnabled: { booleanValue: true },
      consentGiven: { booleanValue: true },
      consentTimestamp: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: '2026-01-01T00:00:00Z' },
    })
    await seedChildProfileWithId(request, uid, 'child-profile-4')

    await page.goto('/')
    await signInViaTestHelper(page, 'ft4-notif@example.com', 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })

    // Allow time for useNotifications to run token refresh on mount
    await page.waitForTimeout(2000)

    const doc = await getFirestoreDocument(request, 'users', uid)
    expect(doc.fields['fcmToken']?.stringValue).toBe(REFRESHED_TOKEN)
  })
})
