import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('FT-2: Name validation', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function goToProfileScreen(page: Parameters<typeof signInViaTestHelper>[0], request: Parameters<typeof clearEmulatorData>[0]) {
    const email = `name-val-${Date.now()}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/profile', { timeout: 10000 })
  }

  test('whitespace-only name keeps button disabled', async ({ page, request }) => {
    await goToProfileScreen(page, request)
    await page.getByTestId('name-input').fill('   ')
    await page.getByTestId('pill-under-3').click()
    await expect(page.getByTestId('start-watching-btn')).toBeDisabled()
  })

  test('valid name + age enables button; clearing name disables it again', async ({ page, request }) => {
    await goToProfileScreen(page, request)
    await page.getByTestId('name-input').fill('Arjun')
    await page.getByTestId('pill-3-4').click()
    await expect(page.getByTestId('start-watching-btn')).not.toBeDisabled()

    await page.getByTestId('name-input').fill('')
    await expect(page.getByTestId('start-watching-btn')).toBeDisabled()
  })
})
