import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideo,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 7 — FT-1: Full-screen player, no bottom nav', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-7/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function navigateToPlayer(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    email: string,
  ) {
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)
    await seedVideo(request, {
      id: 'test-video-1',
      title: 'Test Rhyme',
      youtubeVideoId: 'dQw4w9WgXcQ',
    })
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await expect(page.locator('[data-testid="video-card"]')).toBeVisible({ timeout: 8000 })
    // Client-side navigation — preserves Zustand store
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })
  }

  test('FT-1a: player-screen fills viewport width', async ({ page, request }) => {
    await navigateToPlayer(page, request, 'ft1a-player@example.com')

    const viewportWidth = page.viewportSize()?.width ?? 1280
    const box = await page.locator('[data-testid="player-screen"]').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBe(viewportWidth)
  })

  test('FT-1b: no bottom-nav rendered on player screen', async ({ page, request }) => {
    await navigateToPlayer(page, request, 'ft1b-player@example.com')

    await expect(page.locator('[data-testid="bottom-nav"]')).toHaveCount(0)
  })

  test('FT-1c: player-screen is visible', async ({ page, request }) => {
    await navigateToPlayer(page, request, 'ft1c-player@example.com')

    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible()
  })
})
