import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedChildProfileWithId,
  signInViaTestHelper,
  patchFirestoreDocument,
} from '../support/emulator'

/**
 * FT-6: Settings renders without overflow at 480px width
 *
 * Criterion: [WEB] Renders correctly at 480–768px; no horizontal scroll at < 480px.
 */
test.describe('Story 10 — FT-6: Settings responsive layout', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-10/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupAndOpenSettings(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    email: string,
    viewportWidth: number,
  ) {
    await page.setViewportSize({ width: viewportWidth, height: 800 })

    const uid = await createEmulatorUser(request, email)
    await patchFirestoreDocument(request, 'users', uid, {
      uid: { stringValue: uid },
      email: { stringValue: email },
      displayName: { stringValue: 'Test User' },
      fcmToken: { nullValue: 'NULL_VALUE' },
      notificationsEnabled: { booleanValue: false },
      consentGiven: { booleanValue: true },
      consentTimestamp: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: '2026-01-01T00:00:00Z' },
    })
    await seedChildProfileWithId(request, uid, 'child-profile-10')

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })

    await page.locator('[data-testid="parent-icon"]').click()
    await expect(page.locator('[data-testid="parental-gate"]')).toBeVisible({ timeout: 5000 })
    const q = await page.locator('[data-testid="gate-question"]').textContent()
    const m = q?.match(/(\d+)\s*([+\-\u2212])\s*(\d+)/)
    if (!m) throw new Error(`Cannot parse gate question: ${q}`)
    const ans = m[2] === '+' ? parseInt(m[1]!) + parseInt(m[3]!) : parseInt(m[1]!) - parseInt(m[3]!)
    await page.locator('[data-testid="gate-answer-input"]').fill(String(ans))
    await page.locator('[data-testid="gate-submit-btn"]').click()
    await expect(page.locator('[data-testid="parent-panel"]')).toBeVisible({ timeout: 5000 })

    await page.locator('button:has-text("Settings")').click()
    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible({ timeout: 3000 })
  }

  test('FT-6a: settings renders at 480px with no horizontal overflow', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft6a-responsive@example.com', 480)

    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible()

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasOverflow).toBe(false)
  })

  test('FT-6b: settings renders at 375px with no horizontal overflow', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft6b-responsive@example.com', 375)

    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible()

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasOverflow).toBe(false)
  })

  test('FT-6c: settings screen visible at 768px', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft6c-responsive@example.com', 768)

    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible()
    await expect(page.locator('[data-testid="notif-toggle"]')).toBeVisible()
    await expect(page.locator('[data-testid="privacy-policy-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="sign-out-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="app-version"]')).toBeVisible()
  })
})
