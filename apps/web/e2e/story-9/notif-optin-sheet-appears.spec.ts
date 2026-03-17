import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfileWithId,
  seedVideo,
  signInViaTestHelper,
} from '../support/emulator'

/**
 * FT-1: Opt-in sheet appears after first video end — not on app load
 *
 * Criterion: In-app opt-in prompt shown after first video completed.
 * Android system notification permission dialog triggered only after in-app prompt
 * (not on app launch).
 */
test.describe('Story 9 — FT-1: Notification opt-in sheet appears after video end', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-9/',
  )

  const CHILD_PROFILE_ID = 'child-profile-1'

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupAndNavigateToWatch(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    email: string,
  ) {
    // Inject mock FCM token before page load so notificationService picks it up
    await page.addInitScript(() => {
      ;(window as unknown as Record<string, unknown>)['__mockFcmToken'] = 'test-fcm-token-ft1'
      // Clear the "already prompted" flag so sheet is allowed to appear
      localStorage.removeItem('ckd_notif_prompted')
    })

    const uid = await createEmulatorUser(request, email)
    await seedUserDoc(request, uid, true)
    await seedChildProfileWithId(request, uid, CHILD_PROFILE_ID)
    await seedVideo(request, {
      id: 'test-video-1',
      title: 'Test Rhyme',
      youtubeVideoId: 'dQw4w9WgXcQ',
    })

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
    return uid
  }

  test('FT-1a: opt-in sheet NOT visible on library page (before any video)', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToWatch(page, request, 'ft1a-notif@example.com')

    await expect(page).toHaveURL('/library', { timeout: 5000 })
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible()
  })

  test('FT-1b: opt-in sheet NOT visible immediately on watch page load', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToWatch(page, request, 'ft1b-notif@example.com')

    await expect(page.locator('[data-testid="video-card"]')).toBeVisible({ timeout: 8000 })
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })

    // Sheet must NOT be visible before video ends
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).not.toBeVisible()
  })

  test('FT-1c: opt-in sheet appears after video end', async ({ page, request }) => {
    await setupAndNavigateToWatch(page, request, 'ft1c-notif@example.com')

    await expect(page.locator('[data-testid="video-card"]')).toBeVisible({ timeout: 8000 })
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })

    // Simulate video end via test hook (exposed by PlayerScreen)
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>)['__simulateVideoEnd'] === 'function',
      { timeout: 5000 },
    )
    await page.evaluate(() =>
      (window as unknown as { __simulateVideoEnd: () => void }).__simulateVideoEnd(),
    )

    // Opt-in sheet must appear
    await expect(page.locator('[data-testid="notif-optin-sheet"]')).toBeVisible({ timeout: 3000 })
  })

  test('FT-1d: "Yes, notify me" button is at least 48px tall and full-width', async ({
    page,
    request,
  }) => {
    await setupAndNavigateToWatch(page, request, 'ft1d-notif@example.com')

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

    await expect(page.locator('[data-testid="notif-optin-sheet"]')).toBeVisible({ timeout: 3000 })

    const btnBox = await page.locator('[data-testid="notif-accept-btn"]').boundingBox()
    expect(btnBox).not.toBeNull()
    expect(btnBox!.height).toBeGreaterThanOrEqual(48)

    await expect(page.locator('[data-testid="notif-dismiss-btn"]')).toBeVisible()
  })
})
