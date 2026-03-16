import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('FT-4: CTA disabled until name + age filled', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('button disabled on load; disabled with name only; disabled with age only; enabled with both', async ({
    page,
    request,
  }) => {
    const email = `cta-${Date.now()}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/profile', { timeout: 10000 })

    // Initially disabled
    await expect(page.getByTestId('start-watching-btn')).toBeDisabled()

    // Name only — still disabled
    await page.getByTestId('name-input').fill('Arjun')
    await expect(page.getByTestId('start-watching-btn')).toBeDisabled()

    // Clear name, select age only — still disabled
    await page.getByTestId('name-input').fill('')
    await page.getByTestId('pill-under-3').click()
    await expect(page.getByTestId('start-watching-btn')).toBeDisabled()

    // Both name + age — enabled
    await page.getByTestId('name-input').fill('Arjun')
    await expect(page.getByTestId('start-watching-btn')).not.toBeDisabled()
  })
})
