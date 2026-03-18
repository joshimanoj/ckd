import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedChildProfileWithId,
  signInViaTestHelper,
  patchFirestoreDocument,
} from '../support/emulator'

/**
 * FT-5: App version text is displayed
 *
 * Criterion: App version number displayed (non-interactive).
 */
test.describe('Story 10 — FT-5: App version footer', () => {
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

  test('FT-5a: version footer is visible', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft5a-version@example.com')

    const versionEl = page.locator('[data-testid="app-version"]')
    await expect(versionEl).toBeVisible()
  })

  test('FT-5b: version text matches pattern "Version X.Y.Z"', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft5b-version@example.com')

    const versionEl = page.locator('[data-testid="app-version"]')
    const text = await versionEl.textContent()
    expect(text).toMatch(/Version \d+\.\d+\.\d+/)
  })

  test('FT-5c: version element is not a button or link (non-interactive)', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft5c-version@example.com')

    const versionEl = page.locator('[data-testid="app-version"]')
    const tagName = await versionEl.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).not.toBe('button')
    expect(tagName).not.toBe('a')
  })
})
