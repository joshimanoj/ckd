import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideo,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 7 — FT-10: Responsive layout', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-7/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupUser(
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
  }

  async function signInAndGoToPlayer(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    email: string,
  ) {
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
    await expect(page.locator('[data-testid="video-card"]')).toBeVisible({ timeout: 8000 })
    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page.locator('[data-testid="player-screen"]')).toBeVisible({ timeout: 8000 })
  }

  test('FT-10a: at 480px viewport — player fills width, no horizontal scroll', async ({
    page,
    request,
  }) => {
    await setupUser(request, 'ft10a-responsive@example.com')
    await page.setViewportSize({ width: 480, height: 844 })
    await signInAndGoToPlayer(page, 'ft10a-responsive@example.com')

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(480)

    const box = await page.locator('[data-testid="player-screen"]').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBe(480)
  })

  test('FT-10b: at 768px viewport — player fills width, no overflow', async ({
    page,
    request,
  }) => {
    await setupUser(request, 'ft10b-responsive@example.com')
    await page.setViewportSize({ width: 768, height: 1024 })
    await signInAndGoToPlayer(page, 'ft10b-responsive@example.com')

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(768)

    const box = await page.locator('[data-testid="player-screen"]').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBe(768)
  })

  test('FT-10c: at 375px viewport — no horizontal scroll', async ({ page, request }) => {
    await setupUser(request, 'ft10c-responsive@example.com')
    await page.setViewportSize({ width: 375, height: 812 })
    await signInAndGoToPlayer(page, 'ft10c-responsive@example.com')

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })
})
