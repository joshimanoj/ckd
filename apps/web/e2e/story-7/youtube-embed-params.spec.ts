import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideo,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 7 — FT-2: YouTube iframe embed params', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-7/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('FT-2: iframe src contains rel=0, modestbranding=1, controls=0, autoplay=1 and videoId', async ({
    page,
    request,
  }) => {
    const email = 'ft2-embed@example.com'
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

    const iframe = page.locator('[data-testid="youtube-player"]')
    await expect(iframe).toBeVisible({ timeout: 5000 })

    const src = await iframe.getAttribute('src')
    expect(src).toContain('rel=0')
    expect(src).toContain('modestbranding=1')
    expect(src).toContain('controls=0')
    expect(src).toContain('autoplay=1')
    expect(src).toContain('dQw4w9WgXcQ')
  })
})
