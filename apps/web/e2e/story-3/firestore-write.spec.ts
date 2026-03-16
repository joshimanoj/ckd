import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  signInViaTestHelper,
} from '../support/emulator'

const FIRESTORE = 'http://127.0.0.1:8080'
const PROJECT = 'ckd-test'

test.describe('FT-5: Firestore document written with correct fields on confirm', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  test('writes name, dateOfBirth, createdAt to childProfiles sub-collection', async ({
    page,
    request,
  }) => {
    const email = `fs-write-${Date.now()}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/profile', { timeout: 10000 })

    await page.getByTestId('name-input').fill('Arjun')
    await page.getByTestId('pill-3-4').click()
    await page.getByTestId('start-watching-btn').click()

    await expect(page).toHaveURL('/library', { timeout: 10000 })

    // Verify Firestore document via emulator REST API
    const res = await request.get(
      `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/childProfiles`,
    )
    const body = (await res.json()) as { documents?: Array<{ fields: Record<string, unknown> }> }
    expect(body.documents).toHaveLength(1)

    const fields = body.documents![0]!.fields as Record<string, Record<string, unknown>>
    expect(fields['name']?.['stringValue']).toBe('Arjun')
    expect(fields['dateOfBirth']).toBeDefined()
    expect(fields['createdAt']).toBeDefined()

    // dateOfBirth should be approx 42 months ago (3-4 range)
    const dobStr = fields['dateOfBirth']?.['timestampValue'] as string
    const dobMs = new Date(dobStr).getTime()
    const expectedMs = Date.now() - 42 * 30 * 24 * 60 * 60 * 1000
    expect(Math.abs(dobMs - expectedMs)).toBeLessThan(60 * 24 * 60 * 60 * 1000)
  })
})
