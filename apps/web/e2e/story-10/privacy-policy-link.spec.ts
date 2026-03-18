import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedChildProfileWithId,
  signInViaTestHelper,
  patchFirestoreDocument,
} from '../support/emulator'

/**
 * FT-1: Privacy Policy link is active and opens in new tab
 *
 * Criterion: Privacy Policy link opens external browser (not in-app webview).
 * Link must have target="_blank", a real href, and not be aria-disabled.
 */
test.describe('Story 10 — FT-1: Privacy Policy link', () => {
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
  ) {
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

    // Open Parent Panel via Parental Gate
    await page.locator('[data-testid="parent-icon"]').click()
    await expect(page.locator('[data-testid="parental-gate"]')).toBeVisible({ timeout: 5000 })
    const q = await page.locator('[data-testid="gate-question"]').textContent()
    const m = q?.match(/(\d+)\s*([+\-\u2212])\s*(\d+)/)
    if (!m) throw new Error(`Cannot parse gate question: ${q}`)
    const ans = m[2] === '+' ? parseInt(m[1]!) + parseInt(m[3]!) : parseInt(m[1]!) - parseInt(m[3]!)
    await page.locator('[data-testid="gate-answer-input"]').fill(String(ans))
    await page.locator('[data-testid="gate-submit-btn"]').click()
    await expect(page.locator('[data-testid="parent-panel"]')).toBeVisible({ timeout: 5000 })

    // Switch to Settings tab
    await page.locator('button:has-text("Settings")').click()
    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible({ timeout: 3000 })
  }

  test('FT-1a: privacy policy link is visible', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft1a-pp@example.com')
    await expect(page.locator('[data-testid="privacy-policy-link"]')).toBeVisible()
  })

  test('FT-1b: privacy policy link opens in new tab (target="_blank")', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft1b-pp@example.com')
    const link = page.locator('[data-testid="privacy-policy-link"]')
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('FT-1c: privacy policy link has rel="noopener noreferrer"', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft1c-pp@example.com')
    const link = page.locator('[data-testid="privacy-policy-link"]')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('FT-1d: privacy policy link is NOT aria-disabled', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft1d-pp@example.com')
    const link = page.locator('[data-testid="privacy-policy-link"]')
    await expect(link).not.toHaveAttribute('aria-disabled', 'true')
  })
})
