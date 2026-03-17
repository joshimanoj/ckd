import { test } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

test.skip(!process.env['FIREBASE_EMULATOR_RUNNING'], 'Requires emulator')

test('debug: verify uid matches between seed and browser sign-in', async ({ page, request }) => {
  await clearEmulatorData(request)
  const email = 'debug-match@example.com'

  // Create user and capture the uid returned by REST API
  const seedUid = await createEmulatorUser(request, email, 'password123')
  console.log('Seed UID (from REST API):', seedUid)

  await seedUserDoc(request, seedUid, true)
  await seedChildProfile(request, seedUid)

  await page.goto('/')
  await signInViaTestHelper(page, email, 'password123')
  await page.waitForTimeout(3000)
  console.log('Final URL:', page.url())

  // List ALL user documents in Firestore to see what got created
  const listRes = await request.get(
    'http://127.0.0.1:8080/v1/projects/ckd-test/databases/(default)/documents/users',
  )
  const listBody = await listRes.json()
  console.log('All user docs in Firestore:')
  const docs = (listBody.documents ?? []) as Array<{ name: string; fields?: Record<string, unknown> }>
  docs.forEach((d) => {
    const docId = d.name.split('/').pop()
    const consentGiven = (d.fields as Record<string, { booleanValue?: boolean }> | undefined)?.consentGiven?.booleanValue
    console.log(`  doc: ${docId} | consentGiven: ${consentGiven}`)
  })

  // List all auth accounts to see uids
  const authRes = await request.get('http://127.0.0.1:9099/emulator/v1/projects/ckd-test/accounts')
  const authBody = await authRes.json()
  console.log('Auth accounts:')
  const users = (authBody.userInfo ?? []) as Array<{ localId: string; email: string }>
  users.forEach((u) => console.log(`  uid: ${u.localId} | email: ${u.email}`))
})
