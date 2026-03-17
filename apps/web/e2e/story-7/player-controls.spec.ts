import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideo,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 7 — FT-3: Play/pause button', () => {
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
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })
  }

  test('FT-3a: play/pause button is visible and at least 56×56px', async ({ page, request }) => {
    await navigateToPlayer(page, request, 'ft3a-controls@example.com')

    const btn = page.locator('[data-testid="play-pause-btn"]')
    await expect(btn).toBeVisible()
    const box = await btn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(56)
    expect(box!.height).toBeGreaterThanOrEqual(56)
  })

  test('FT-3b: clicking play/pause toggles aria-label', async ({ page, request }) => {
    await navigateToPlayer(page, request, 'ft3b-controls@example.com')

    const btn = page.locator('[data-testid="play-pause-btn"]')
    const initialLabel = await btn.getAttribute('aria-label')
    await btn.click()
    const afterLabel = await btn.getAttribute('aria-label')
    expect(afterLabel).not.toBe(initialLabel)
    expect(['Play', 'Pause']).toContain(afterLabel)
  })
})
