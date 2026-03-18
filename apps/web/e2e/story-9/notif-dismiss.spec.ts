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

/**
 * FT-2: "Not now" dismisses sheet — notificationsEnabled stays false
 *
 * Criterion: If denied or "Not now": notificationsEnabled: false remains;
 * no retry until parent enables via Settings.
 */
test.describe('Story 9 — FT-2: "Not now" dismisses sheet, notificationsEnabled stays false', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-9/',
  )

  const CHILD_PROFILE_ID = 'child-profile-2'

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupAndTriggerSheet(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    email: string,
  ) {
    await page.addInitScript(() => {
      ;(window as unknown as Record<string, unknown>)['__mockFcmToken'] = 'test-fcm-token-ft2'
    })

    const uid = await createEmulatorUser(request, email)
    await seedUserDoc(request, uid, true)
    await seedChildProfileWithId(request, uid, CHILD_PROFILE_ID)
    await seedVideo(request, {
      id: 'test-video-2',
      title: 'Test Rhyme 2',
      youtubeVideoId: 'dQw4w9WgXcQ',
    })

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
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

    return uid
  }

  test('FT-2a: "Not now" dismisses the opt-in sheet', async ({ page, request }) => {
    await setupAndTriggerSheet(page, request, 'ft2a-notif@example.com')

    await page.locator('[data-testid="notif-dismiss-btn"]').click()

    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible({
      timeout: 2000,
    })
  })

  test('FT-2b: notificationsEnabled stays false after "Not now"', async ({
    page,
    request,
  }) => {
    const uid = await setupAndTriggerSheet(page, request, 'ft2b-notif@example.com')

    await page.locator('[data-testid="notif-dismiss-btn"]').click()
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible({
      timeout: 2000,
    })

    // Wait briefly for any Firestore write that should NOT happen
    await page.waitForTimeout(500)

    const doc = await getFirestoreDocument(request, 'users', uid)
    expect(doc.fields['notificationsEnabled']?.booleanValue).toBe(false)
  })

  test('FT-2c: sheet does not appear again after "Not now" (localStorage flag set)', async ({
    page,
    request,
  }) => {
    await setupAndTriggerSheet(page, request, 'ft2c-notif@example.com')

    await page.locator('[data-testid="notif-dismiss-btn"]').click()
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible({
      timeout: 2000,
    })

    // Navigate to next video and simulate end — sheet should NOT appear again
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

    // Wait a moment — sheet should NOT appear
    await page.waitForTimeout(1000)
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible()
  })
})
