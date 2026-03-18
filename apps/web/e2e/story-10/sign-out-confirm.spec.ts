import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedChildProfileWithId,
  signInViaTestHelper,
  patchFirestoreDocument,
} from '../support/emulator'

/**
 * FT-3: Confirming Sign Out redirects to sign-in screen
 *
 * Criterion: Sign Out navigates to Sign In screen and clears all Zustand stores.
 */
test.describe('Story 10 — FT-3: Sign Out confirm → redirect to sign-in', () => {
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

  test('FT-3: confirming sign out redirects to sign-in screen', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft3-signout@example.com')

    await page.locator('[data-testid="sign-out-btn"]').click()
    await expect(page.locator('[data-testid="sign-out-confirm-dialog"]')).toBeVisible({ timeout: 3000 })
    await page.locator('[data-testid="sign-out-confirm-btn"]').click()

    // Should redirect to sign-in screen
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.locator('[data-testid="sign-in-screen"]')).toBeVisible({ timeout: 5000 })
  })

  test('FT-3b: after sign out, navigating to /library redirects to sign-in', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft3b-signout@example.com')

    await page.locator('[data-testid="sign-out-btn"]').click()
    await expect(page.locator('[data-testid="sign-out-confirm-dialog"]')).toBeVisible({ timeout: 3000 })
    await page.locator('[data-testid="sign-out-confirm-btn"]').click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Attempt to navigate to library — should be redirected back to sign-in
    await page.goto('/library')
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })
})
