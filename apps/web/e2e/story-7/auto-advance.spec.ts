import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideos,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 7 — FT-8: Auto-advance to next video', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-7/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setup(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    email: string,
  ) {
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)
    // Seed 3 videos with publishedAt DESC ordering: v3 (newest) first in store
    await seedVideos(request, [
      { id: 'video-1', title: 'Video One', youtubeVideoId: 'yt-v1', publishedAt: '2026-01-01T00:00:00Z', order: 3 },
      { id: 'video-2', title: 'Video Two', youtubeVideoId: 'yt-v2', publishedAt: '2026-02-01T00:00:00Z', order: 2 },
      { id: 'video-3', title: 'Video Three', youtubeVideoId: 'yt-v3', publishedAt: '2026-03-01T00:00:00Z', order: 1 },
    ])
    // Bypass Story 9 notification opt-in sheet so auto-advance fires immediately
    await page.addInitScript(() => localStorage.setItem('ckd_notif_prompted', '1'))
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(3, { timeout: 8000 })
  }

  test('FT-8a: video-3 (newest, index 0) ends → navigates to video-2 (index 1)', async ({
    page,
    request,
  }) => {
    await setup(page, request, 'ft8a-advance@example.com')
    // Store order (publishedAt DESC): [video-3, video-2, video-1]
    // Click "Video Three" card to navigate client-side to /watch/video-3
    await page.locator('[data-testid="card-title"]', { hasText: 'Video Three' }).click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })

    await page.evaluate(() => {
      ;(window as unknown as Record<string, () => void>)['__simulateVideoEnd']?.()
    })

    await expect(page).toHaveURL('/watch/video-2', { timeout: 5000 })
  })

  test('FT-8b: video-1 (oldest, index 2) ends → wraps to video-3 (index 0)', async ({
    page,
    request,
  }) => {
    await setup(page, request, 'ft8b-advance@example.com')
    // Store order (publishedAt DESC): [video-3, video-2, video-1]
    // Click "Video One" card to navigate client-side to /watch/video-1
    await page.locator('[data-testid="card-title"]', { hasText: 'Video One' }).click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })

    await page.evaluate(() => {
      ;(window as unknown as Record<string, () => void>)['__simulateVideoEnd']?.()
    })

    await expect(page).toHaveURL('/watch/video-3', { timeout: 5000 })
  })
})
