/**
 * FT-6: Cloud Function: notification doc created → status:'sent'
 *
 * Integration test — requires Firebase Functions + Firestore emulators running.
 * Run: FUNCTIONS_EMULATOR_RUNNING=1 npx vitest run functions/src/__tests__/sendNotification.integration.test.ts
 *
 * NOTE: This test will not compile until Task 10 (functions/package.json + sendNotification.ts) is complete.
 * Initial Status: RED
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Skip entire suite if Functions emulator is not running
const SKIP = !process.env['FUNCTIONS_EMULATOR_RUNNING']

describe('FT-6: sendNotification Cloud Function — integration', () => {
  if (SKIP) {
    it.skip('Requires Firebase Functions emulator — run: FUNCTIONS_EMULATOR_RUNNING=1 vitest run', () => {})
    return
  }

  const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080'
  const PROJECT = 'ckd-test'

  // Helper: write document to Firestore emulator via REST
  async function patchFirestore(collection: string, docId: string, fields: Record<string, unknown>) {
    const res = await fetch(
      `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      },
    )
    if (!res.ok) throw new Error(`PATCH ${collection}/${docId} failed: ${await res.text()}`)
  }

  async function getFirestore(collection: string, docId: string) {
    const res = await fetch(
      `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}`,
    )
    if (!res.ok) throw new Error(`GET ${collection}/${docId} failed: ${await res.text()}`)
    return (await res.json()) as { fields: Record<string, Record<string, unknown>> }
  }

  async function clearFirestore() {
    await fetch(
      `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
      { method: 'DELETE' },
    )
  }

  async function pollForStatus(
    notifId: string,
    expectedStatus: string,
    timeoutMs = 5000,
    intervalMs = 500,
  ): Promise<Record<string, Record<string, unknown>>> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const doc = await getFirestore('notifications', notifId)
      if (doc.fields['status']?.stringValue === expectedStatus) return doc
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    throw new Error(`Timeout waiting for notifications/${notifId}.status === '${expectedStatus}'`)
  }

  beforeAll(async () => {
    await clearFirestore()
  })

  afterAll(async () => {
    await clearFirestore()
  })

  it('FT-6a: creates notification doc → Cloud Function updates status to "sent"', async () => {
    // Seed one opted-in user
    await patchFirestore('users', 'ft6-user-1', {
      uid: { stringValue: 'ft6-user-1' },
      email: { stringValue: 'ft6@example.com' },
      displayName: { stringValue: 'FT6 User' },
      fcmToken: { stringValue: 'ft6-valid-token-001' },
      notificationsEnabled: { booleanValue: true },
      consentGiven: { booleanValue: true },
      consentTimestamp: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: '2026-01-01T00:00:00Z' },
    })

    // Create notification document (triggers Cloud Function)
    await patchFirestore('notifications', 'ft6-notif-1', {
      title: { stringValue: 'New Rhyme Added!' },
      body: { stringValue: 'Check out the latest video.' },
      youtubeVideoId: { nullValue: 'NULL_VALUE' },
      status: { stringValue: 'pending' },
      sentAt: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: new Date().toISOString() },
    })

    // Poll until Cloud Function updates status
    const doc = await pollForStatus('ft6-notif-1', 'sent', 5000)

    expect(doc.fields['status']?.stringValue).toBe('sent')
    expect(doc.fields['sentAt']?.timestampValue).toBeTruthy()
  })

  it('FT-6b: users with notificationsEnabled:false are excluded from FCM send', async () => {
    await patchFirestore('users', 'ft6-opted-out', {
      uid: { stringValue: 'ft6-opted-out' },
      email: { stringValue: 'ft6-out@example.com' },
      displayName: { stringValue: 'FT6 Opted Out' },
      fcmToken: { stringValue: 'should-not-receive-token' },
      notificationsEnabled: { booleanValue: false },
      consentGiven: { booleanValue: true },
      consentTimestamp: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: '2026-01-01T00:00:00Z' },
    })

    await patchFirestore('notifications', 'ft6-notif-2', {
      title: { stringValue: 'Another Rhyme!' },
      body: { stringValue: 'So many rhymes.' },
      youtubeVideoId: { nullValue: 'NULL_VALUE' },
      status: { stringValue: 'pending' },
      sentAt: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: new Date().toISOString() },
    })

    // Function should complete (status set to 'sent') — opted-out user was not targeted
    const doc = await pollForStatus('ft6-notif-2', 'sent', 5000)
    expect(doc.fields['status']?.stringValue).toBe('sent')
  })

  it('FT-6c: handles zero opted-in users gracefully (status: "sent", no crash)', async () => {
    // No users seeded — all existing users cleared in beforeAll
    await patchFirestore('notifications', 'ft6-notif-3', {
      title: { stringValue: 'Empty Audience' },
      body: { stringValue: 'No one to notify.' },
      youtubeVideoId: { nullValue: 'NULL_VALUE' },
      status: { stringValue: 'pending' },
      sentAt: { nullValue: 'NULL_VALUE' },
      createdAt: { timestampValue: new Date().toISOString() },
    })

    const doc = await pollForStatus('ft6-notif-3', 'sent', 5000)
    expect(doc.fields['status']?.stringValue).toBe('sent')
  })
})
