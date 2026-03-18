import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideos,
  seedVideo,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 5 — Video Library Grid', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-5/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupUser(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    emailPrefix: string,
  ): Promise<string> {
    const email = `${emailPrefix}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)
    return uid
  }

  async function signInAndNavigate(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    email: string,
  ) {
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })
  }

  // FT-1: Library fetches active videos ordered by publishedAt DESC
  test('FT-1: grid shows active videos newest-first', async ({ page, request }) => {
    const email = 'ft1-lib@example.com'
    await setupUser(page, request, 'ft1-lib')
    await seedVideos(request, [
      { id: 'v1', title: 'Test Rhyme January', category: 'Rhymes', publishedAt: '2026-01-01T00:00:00Z', order: 3 },
      { id: 'v2', title: 'Test Rhyme February', category: 'Rhymes', publishedAt: '2026-02-01T00:00:00Z', order: 2 },
      { id: 'v3', title: 'Test Rhyme March', category: 'Rhymes', publishedAt: '2026-03-01T00:00:00Z', order: 1 },
    ])
    await signInAndNavigate(page, email)

    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(3, { timeout: 8000 })
    const titles = page.locator('[data-testid="card-title"]')
    await expect(titles.first()).toHaveText('Test Rhyme March')
    await expect(titles.last()).toHaveText('Test Rhyme January')
  })

  // FT-2: Videos cached — no re-fetch on return visit
  test('FT-2: no Firestore re-fetch on return visit to library', async ({ page, request }) => {
    const email = 'ft2-lib@example.com'
    await setupUser(page, request, 'ft2-lib')
    await seedVideos(request, [
      { id: 'v1', title: 'Rhyme One', publishedAt: '2026-01-01T00:00:00Z' },
      { id: 'v2', title: 'Rhyme Two', publishedAt: '2026-02-01T00:00:00Z' },
    ])

    let firestoreCallCount = 0
    await page.route('**/documents/videos**', async (route) => {
      firestoreCallCount++
      await route.continue()
    })

    await signInAndNavigate(page, email)
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(2, { timeout: 8000 })
    const callsAfterFirstLoad = firestoreCallCount

    // Navigate away and back
    await page.goto('/profile')
    await page.goto('/library')
    await expect(page.locator('[data-testid="video-grid"]')).toBeVisible({ timeout: 8000 })

    // No extra Firestore calls should have been made on return visit
    expect(firestoreCallCount).toBe(callsAfterFirstLoad)
  })

  // FT-3: Grid renders in 2 columns with correct spacing
  test('FT-3: grid renders 2-column layout, no horizontal overflow at 375px', async ({ page, request }) => {
    const email = 'ft3-lib@example.com'
    await setupUser(page, request, 'ft3-lib')
    await seedVideos(request, [
      { id: 'v1', title: 'Card One', publishedAt: '2026-01-01T00:00:00Z' },
      { id: 'v2', title: 'Card Two', publishedAt: '2026-02-01T00:00:00Z' },
      { id: 'v3', title: 'Card Three', publishedAt: '2026-03-01T00:00:00Z' },
      { id: 'v4', title: 'Card Four', publishedAt: '2026-04-01T00:00:00Z' },
    ])
    await page.setViewportSize({ width: 480, height: 800 })
    await signInAndNavigate(page, email)
    await expect(page.locator('[data-testid="video-grid"]')).toBeVisible({ timeout: 8000 })

    // Check grid is 2 columns
    const columnCount = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="video-grid"]')
      if (!grid) return 0
      const style = window.getComputedStyle(grid)
      const cols = style.gridTemplateColumns.split(' ').filter(Boolean)
      return cols.length
    })
    expect(columnCount).toBe(2)

    // No horizontal scroll at 375px
    await page.setViewportSize({ width: 375, height: 667 })
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasOverflow).toBe(false)
  })

  // FT-4: Each card shows thumbnail (16:9), title, category chip
  test('FT-4: video card shows thumbnail, title, and category chip', async ({ page, request }) => {
    const email = 'ft4-lib@example.com'
    await setupUser(page, request, 'ft4-lib')
    await seedVideo(request, {
      id: 'v1',
      title: 'Test Rhyme Title',
      category: 'Colours',
      publishedAt: '2026-01-01T00:00:00Z',
      youtubeVideoId: 'abc123test',
      thumbnailUrl: 'https://img.youtube.com/vi/abc123test/0.jpg',
    })
    await signInAndNavigate(page, email)
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(1, { timeout: 8000 })

    await expect(page.locator('[data-testid="card-thumbnail"]')).toHaveAttribute(
      'src',
      'https://img.youtube.com/vi/abc123test/0.jpg',
    )
    await expect(page.locator('[data-testid="card-title"]')).toHaveText('Test Rhyme Title')
    await expect(page.locator('[data-testid="card-category-chip"]')).toHaveText('Colours')
  })

  // FT-5: Parent icon renders top-right and triggers Parental Gate
  test('FT-5: parent icon visible; triggers gate modal on tap', async ({ page, request }) => {
    const email = 'ft5-lib@example.com'
    await setupUser(page, request, 'ft5-lib')
    await signInAndNavigate(page, email)

    await expect(page.getByTestId('parent-icon')).toBeVisible()
    await expect(page.getByTestId('parental-gate')).not.toBeVisible()

    await page.getByTestId('parent-icon').click()
    await expect(page.getByTestId('parental-gate')).toBeVisible()
  })

  // FT-6: Pull-to-refresh re-fetches and updates video list
  test('FT-6: refresh button re-fetches and shows new videos', async ({ page, request }) => {
    const email = 'ft6-lib@example.com'
    const uid = await setupUser(page, request, 'ft6-lib')
    void uid
    await seedVideos(request, [
      { id: 'v1', title: 'Video One', publishedAt: '2026-01-01T00:00:00Z' },
      { id: 'v2', title: 'Video Two', publishedAt: '2026-02-01T00:00:00Z' },
    ])
    await signInAndNavigate(page, email)
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(2, { timeout: 8000 })

    // Add a third video while the library is already loaded
    await seedVideo(request, { id: 'v3', title: 'Video Three', publishedAt: '2026-03-01T00:00:00Z' })

    await page.getByTestId('refresh-btn').click()
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(3, { timeout: 8000 })
  })

  // FT-7: Category filter hidden < 20 videos, visible at >= 20
  test('FT-7: category filter hidden with 19 videos; visible after refresh with 20', async ({
    page,
    request,
  }) => {
    const email = 'ft7-lib@example.com'
    await setupUser(page, request, 'ft7-lib')
    const nineteen = Array.from({ length: 19 }, (_, i) => ({
      id: `v${i + 1}`,
      title: `Video ${i + 1}`,
      publishedAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      category: i % 2 === 0 ? 'Rhymes' : 'Colours',
    }))
    await seedVideos(request, nineteen)
    await signInAndNavigate(page, email)
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(19, { timeout: 10000 })

    await expect(page.locator('[data-testid="category-filter"]')).toBeHidden()

    // Add 20th video, then refresh
    await seedVideo(request, { id: 'v20', title: 'Video 20', publishedAt: '2026-02-01T00:00:00Z' })
    await page.getByTestId('refresh-btn').click()
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(20, { timeout: 10000 })
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible()
  })

  // FT-8: Tapping a card navigates to /watch/:videoId
  test('FT-8: tapping video card navigates to /watch/:videoId', async ({ page, request }) => {
    const email = 'ft8-lib@example.com'
    await setupUser(page, request, 'ft8-lib')
    await seedVideo(request, { id: 'test-video-abc', title: 'Navigate Test', publishedAt: '2026-01-01T00:00:00Z' })
    await signInAndNavigate(page, email)
    await expect(page.locator('[data-testid="video-card"]')).toHaveCount(1, { timeout: 8000 })

    await page.locator('[data-testid="video-card"]').first().click()
    await expect(page).toHaveURL(/\/watch\/test-video-abc/, { timeout: 5000 })
  })

  // FT-9: Empty state when 0 active videos
  test('FT-9: empty state shown when no active videos exist', async ({ page, request }) => {
    const email = 'ft9-lib@example.com'
    await setupUser(page, request, 'ft9-lib')
    // Seed only an inactive video — should not appear
    await seedVideo(request, {
      id: 'inactive-v1',
      title: 'Hidden Video',
      publishedAt: '2026-01-01T00:00:00Z',
      isActive: false,
    })
    await signInAndNavigate(page, email)

    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('Videos coming soon!')
    await expect(page.locator('[data-testid="video-grid"]')).not.toBeVisible()
  })

  // FT-10: Skeleton shimmer shown while initial fetch is in progress
  test('FT-10: skeleton shimmer visible during fetch; disappears after load', async ({
    page,
    request,
  }) => {
    const email = 'ft10-lib@example.com'
    await setupUser(page, request, 'ft10-lib')
    await seedVideo(request, { id: 'v1', title: 'Loading Test', publishedAt: '2026-01-01T00:00:00Z' })

    await page.goto('/')
    // Wait for main.tsx test hooks to initialise (same callback sets __testSignIn and __testVideoFetchDelayMs)
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>)['__testSignIn'] === 'function',
      { timeout: 5000 },
    )
    // Set delay AFTER initialisation so main.tsx doesn't overwrite it back to 0.
    // fetchActiveVideos (emulator-only) reads this flag and waits before querying Firestore.
    await page.evaluate(() => {
      ;(window as unknown as Record<string, number>)['__testVideoFetchDelayMs'] = 800
    })
    await signInViaTestHelper(page, email, 'password123')

    // Skeleton should be visible during the 800 ms artificial delay
    await expect(page.locator('[data-testid="skeleton-grid"]')).toBeVisible({ timeout: 8000 })

    // After fetch completes, skeleton gone and grid present
    await expect(page.locator('[data-testid="video-grid"]')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('[data-testid="skeleton-grid"]')).not.toBeVisible()
  })
})
