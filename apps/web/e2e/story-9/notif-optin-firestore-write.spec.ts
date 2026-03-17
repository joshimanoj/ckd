import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfileWithId,
  seedVideo,
  signInViaTestHelper,
  getFirestoreDocument,
} from '../support/emulator'

const MOCK_FCM_TOKEN = 'test-fcm-token-ft3-accept'

/**
 * FT-3: "Yes, notify me" → Firestore: notificationsEnabled:true + fcmToken written
 *
 * Criterion: FCM token requested and written to users/{uid}.fcmToken on permission grant;
 * notificationsEnabled: true on opt-in.
 */
test.describe('Story 9 — FT-3: "Yes, notify me" writes notificationsEnabled:true and fcmToken', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-9/',
  )

  const CHILD_PROFILE_ID = 'child-profile-3'

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('FT-3a: accepts opt-in → notificationsEnabled:true and fcmToken written to Firestore', async ({
    page,
    request,
    context,
  }) => {
    await context.grantPermissions(['notifications'])

    await page.addInitScript((token: string) => {
      ;(window as unknown as Record<string, unknown>)['__mockFcmToken'] = token
      localStorage.removeItem('ckd_notif_prompted')
    }, MOCK_FCM_TOKEN)

    const uid = await createEmulatorUser(request, 'ft3a-notif@example.com')
    await seedUserDoc(request, uid, true)
    await seedChildProfileWithId(request, uid, CHILD_PROFILE_ID)
    await seedVideo(request, {
      id: 'test-video-3',
      title: 'Test Rhyme 3',
      youtubeVideoId: 'dQw4w9WgXcQ',
    })

    await page.goto('/')
    await signInViaTestHelper(page, 'ft3a-notif@example.com', 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await expect(page.locator('[data-testid="video-card"]')).toBeVisible({ timeout: 8000 })
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })

    // Trigger video end
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>)['__simulateVideoEnd'] === 'function',
      { timeout: 5000 },
    )
    await page.evaluate(() =>
      (window as unknown as { __simulateVideoEnd: () => void }).__simulateVideoEnd(),
    )
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).toBeVisible({ timeout: 3000 })

    // Accept
    await page.locator('[data-testid="notif-accept-btn"]').click()

    // Sheet should dismiss
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible({
      timeout: 5000,
    })

    // Wait for Firestore write to complete
    await page.waitForTimeout(1000)

    // Verify Firestore
    const doc = await getFirestoreDocument(request, 'users', uid)
    expect(doc.fields['notificationsEnabled']?.booleanValue).toBe(true)
    expect(doc.fields['fcmToken']?.stringValue).toBe(MOCK_FCM_TOKEN)
  })

  test('FT-3b: sheet dismisses after accept and does not reappear', async ({
    page,
    request,
    context,
  }) => {
    await context.grantPermissions(['notifications'])

    await page.addInitScript((token: string) => {
      ;(window as unknown as Record<string, unknown>)['__mockFcmToken'] = token
      localStorage.removeItem('ckd_notif_prompted')
    }, MOCK_FCM_TOKEN)

    const uid = await createEmulatorUser(request, 'ft3b-notif@example.com')
    await seedUserDoc(request, uid, true)
    await seedChildProfileWithId(request, uid, CHILD_PROFILE_ID)
    await seedVideo(request, {
      id: 'test-video-3',
      title: 'Test Rhyme 3',
      youtubeVideoId: 'dQw4w9WgXcQ',
    })

    await page.goto('/')
    await signInViaTestHelper(page, 'ft3b-notif@example.com', 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })

    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>)['__simulateVideoEnd'] === 'function',
      { timeout: 5000 },
    )
    await page.evaluate(() =>
      (window as unknown as { __simulateVideoEnd: () => void }).__simulateVideoEnd(),
    )
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).toBeVisible({ timeout: 3000 })

    await page.locator('[data-testid="notif-accept-btn"]').click()
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible({
      timeout: 5000,
    })

    // Play another video — sheet should not reappear
    await page.goto('/library')
    await expect(page.locator('[data-testid="video-card"]')).toBeVisible({ timeout: 8000 })
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })

    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>)['__simulateVideoEnd'] === 'function',
      { timeout: 5000 },
    )
    await page.evaluate(() =>
      (window as unknown as { __simulateVideoEnd: () => void }).__simulateVideoEnd(),
    )

    await page.waitForTimeout(1000)
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible()
  })
})
