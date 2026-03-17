import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedChildProfileWithId,
  signInViaTestHelper,
  getFirestoreDocument,
  patchFirestoreDocument,
} from '../support/emulator'

/**
 * FT-5: Settings tab notification toggle with Parental Gate enforcement
 *
 * Criterion: notificationsEnabled toggle in Settings updates Firestore in real-time;
 * Parental Gate enforced before toggle changes state.
 */
test.describe('Story 9 — FT-5: Settings notification toggle with Parental Gate', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-9/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupAndOpenSettings(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    email: string,
    notificationsEnabled: boolean,
  ) {
    const uid = await createEmulatorUser(request, email)
    await patchFirestoreDocument(request, 'users', uid, {
      uid: { stringValue: uid },
      email: { stringValue: email },
      displayName: { stringValue: 'Test User' },
      fcmToken: { stringValue: 'test-token' },
      notificationsEnabled: { booleanValue: notificationsEnabled },
      consentGiven: { booleanValue: true },
      consentTimestamp: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: '2026-01-01T00:00:00Z' },
    })
    await seedChildProfileWithId(request, uid, 'child-profile-5')

    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })

    // Open Parent Panel
    await page.locator('[data-testid="parent-icon"]').click()
    await expect(page.locator('[data-testid="parent-panel"]')).toBeVisible({ timeout: 5000 })

    // Click Settings tab
    await page.locator('button:has-text("Settings")').click()
    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible({ timeout: 3000 })

    return uid
  }

  test('FT-5a: notification toggle is visible in Settings tab', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft5a-notif@example.com', false)

    await expect(page.locator('[data-testid="notif-toggle"]')).toBeVisible()
  })

  test('FT-5b: Parental Gate appears when toggle is tapped', async ({ page, request }) => {
    await setupAndOpenSettings(page, request, 'ft5b-notif@example.com', false)

    await page.locator('[data-testid="notif-toggle"]').click()
    await expect(page.locator('[data-testid="parental-gate"]')).toBeVisible({ timeout: 3000 })
  })

  test('FT-5c: toggle does NOT change without correct gate answer', async ({
    page,
    request,
  }) => {
    const uid = await setupAndOpenSettings(page, request, 'ft5c-notif@example.com', false)

    await page.locator('[data-testid="notif-toggle"]').click()
    await expect(page.locator('[data-testid="parental-gate"]')).toBeVisible({ timeout: 3000 })

    // Enter wrong answer (a very large number unlikely to be correct)
    await page.locator('[data-testid="gate-answer-input"]').fill('99')
    await page.locator('[data-testid="gate-submit-btn"]').click()

    // Gate should still be visible (wrong answer = new question, not dismissed)
    // Or check the toggle hasn't changed
    await page.waitForTimeout(500)

    const doc = await getFirestoreDocument(request, 'users', uid)
    expect(doc.fields['notificationsEnabled']?.booleanValue).toBe(false)
  })

  test('FT-5d: toggle changes and Firestore updates after correct gate answer', async ({
    page,
    request,
  }) => {
    const uid = await setupAndOpenSettings(page, request, 'ft5d-notif@example.com', false)

    await page.locator('[data-testid="notif-toggle"]').click()
    await expect(page.locator('[data-testid="parental-gate"]')).toBeVisible({ timeout: 3000 })

    // Read the math question and calculate the answer
    const questionText = await page.locator('[data-testid="gate-question"]').textContent()
    const match = questionText?.match(/(\d+)\s*([+\-])\s*(\d+)/)
    if (!match) throw new Error(`Could not parse gate question: ${questionText}`)
    const a = parseInt(match[1]!)
    const op = match[2]!
    const b = parseInt(match[3]!)
    const answer = op === '+' ? a + b : a - b

    await page.locator('[data-testid="gate-answer-input"]').fill(String(answer))
    await page.locator('[data-testid="gate-submit-btn"]').click()

    // Gate dismisses, toggle should reflect new state
    await expect(page.locator('[data-testid="parental-gate"]')).not.toBeVisible({
      timeout: 3000,
    })

    await page.waitForTimeout(1000)

    const doc = await getFirestoreDocument(request, 'users', uid)
    expect(doc.fields['notificationsEnabled']?.booleanValue).toBe(true)
  })
})
