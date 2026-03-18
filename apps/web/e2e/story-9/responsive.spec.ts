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
 * FT-7: Responsive layout — no horizontal scroll at < 480px
 *
 * Criterion: Renders correctly at 480–768px; no horizontal scroll at viewports < 480px.
 */
test.describe('Story 9 — FT-7: Responsive layout, no horizontal scroll', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-9/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupUser(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    email: string,
  ) {
    await page.addInitScript(() => {
      ;(window as unknown as Record<string, unknown>)['__mockFcmToken'] = 'test-token-responsive'
      localStorage.removeItem('ckd_notif_prompted')
    })

    const uid = await createEmulatorUser(request, email)
    await seedUserDoc(request, uid, true)
    await seedChildProfileWithId(request, uid, 'child-profile-7')
    await seedVideo(request, {
      id: 'test-video-7',
      title: 'Test Rhyme 7',
      youtubeVideoId: 'dQw4w9WgXcQ',
    })
    return uid
  }

  for (const viewport of [375, 480] as const) {
    test(`FT-7: no horizontal scroll at ${viewport}px viewport`, async ({ page, request }) => {
      await page.setViewportSize({ width: viewport, height: 812 })
      await setupUser(page, request, `ft7-${viewport}-notif@example.com`)

      await page.goto('/')
      await signInViaTestHelper(page, `ft7-${viewport}-notif@example.com`, 'password123')
      await expect(page).toHaveURL('/library', { timeout: 10000 })

      // Check library page — no horizontal scroll
      const libraryOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      )
      expect(libraryOverflow).toBe(true)

      // Navigate to watch page and trigger opt-in sheet
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

      // Check sheet — no overflow
      const sheetOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      )
      expect(sheetOverflow).toBe(true)

      // Accept button fits within viewport
      const acceptBtnBox = await page.locator('[data-testid="notif-accept-btn"]').boundingBox()
      expect(acceptBtnBox).not.toBeNull()
      expect(acceptBtnBox!.x + acceptBtnBox!.width).toBeLessThanOrEqual(viewport)
    })
  }
})
