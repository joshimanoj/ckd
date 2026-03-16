import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('FT-3: Age range selector — single select', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('three pills present; clicking one selects it and deselects others', async ({ page, request }) => {
    const email = `age-sel-${Date.now()}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/profile', { timeout: 10000 })

    await expect(page.getByTestId('pill-under-3')).toBeVisible()
    await expect(page.getByTestId('pill-3-4')).toBeVisible()
    await expect(page.getByTestId('pill-5-6')).toBeVisible()

    await page.getByTestId('pill-under-3').click()
    await expect(page.getByTestId('pill-under-3')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('pill-3-4')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('pill-5-6')).toHaveAttribute('aria-pressed', 'false')

    await page.getByTestId('pill-3-4').click()
    await expect(page.getByTestId('pill-under-3')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('pill-3-4')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('pill-5-6')).toHaveAttribute('aria-pressed', 'false')

    await page.getByTestId('pill-5-6').click()
    await expect(page.getByTestId('pill-3-4')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('pill-5-6')).toHaveAttribute('aria-pressed', 'true')
  })
})
