import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideo,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 7 — FT-9: Error state on failure + retry', () => {
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

  test('FT-9a: error overlay visible after __simulatePlayerError', async ({ page, request }) => {
    await navigateToPlayer(page, request, 'ft9a-error@example.com')

    await page.evaluate(() => {
      ;(window as unknown as Record<string, () => void>)['__simulatePlayerError']?.()
    })

    await expect(page.locator('[data-testid="player-error"]')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('[data-testid="player-error"]')).toContainText(
      'Check your internet connection',
    )
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible()
  })

  test('FT-9b: clicking retry dismisses error and shows player again', async ({
    page,
    request,
  }) => {
    await navigateToPlayer(page, request, 'ft9b-error@example.com')

    await page.evaluate(() => {
      ;(window as unknown as Record<string, () => void>)['__simulatePlayerError']?.()
    })
    await expect(page.locator('[data-testid="player-error"]')).toBeVisible({ timeout: 3000 })

    await page.locator('[data-testid="retry-btn"]').click()

    await expect(page.locator('[data-testid="player-error"]')).not.toBeVisible()
    const playerOrLoading = page.locator(
      '[data-testid="youtube-player"], [data-testid="player-loading"]',
    )
    await expect(playerOrLoading.first()).toBeVisible({ timeout: 3000 })
  })
})
