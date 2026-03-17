import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  seedVideo,
  seedVideos,
  setAdminClaim,
  getFirestoreDocument,
  listFirestoreCollection,
  patchFirestoreDocument,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 6 — Admin Panel', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-6/',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  async function setupAdminUser(
    request: Parameters<Parameters<typeof test>[1]>[0]['request'],
    emailPrefix: string,
  ): Promise<{ uid: string; email: string }> {
    const email = `${emailPrefix}@example.com`
    const uid = await createEmulatorUser(request, email, 'password123')
    await setAdminClaim(request, uid)
    return { uid, email }
  }

  async function signInAsAdmin(
    page: Parameters<Parameters<typeof test>[1]>[0]['page'],
    email: string,
  ): Promise<void> {
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await page.goto('/admin')
    await expect(page.getByTestId('admin-page')).toBeVisible({ timeout: 10000 })
  }

  // FT-1: /admin access control
  test('FT-1a: unauthenticated user navigating to /admin is redirected to /', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/', { timeout: 5000 })
    await expect(page.getByTestId('admin-page')).not.toBeVisible()
  })

  test('FT-1b: non-admin authenticated user is redirected away from /admin', async ({
    page,
    request,
  }) => {
    const email = 'ft1b-nonadmin@example.com'
    const uid = await createEmulatorUser(request, email, 'password123')
    await seedUserDoc(request, uid, true)
    await seedChildProfile(request, uid)
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await expect(page).toHaveURL('/library', { timeout: 10000 })

    await page.goto('/admin')
    await expect(page).not.toHaveURL('/admin', { timeout: 5000 })
    await expect(page.getByTestId('admin-page')).not.toBeVisible()
  })

  test('FT-1c: admin user can access /admin and sees admin panel', async ({ page, request }) => {
    const { email } = await setupAdminUser(request, 'ft1c-admin')
    await page.goto('/')
    await signInViaTestHelper(page, email, 'password123')
    await page.goto('/admin')
    await expect(page.getByTestId('admin-page')).toBeVisible({ timeout: 10000 })
  })

  // FT-2: Video list shows all videos (active + inactive) ordered by publishedAt DESC
  test('FT-2: video list shows all videos newest-first, including inactive', async ({
    page,
    request,
  }) => {
    const { email } = await setupAdminUser(request, 'ft2-admin')
    await seedVideos(request, [
      { id: 'v-old', title: 'Oldest Video', publishedAt: '2026-01-01T00:00:00Z', isActive: true },
      { id: 'v-mid', title: 'Middle Video', publishedAt: '2026-02-01T00:00:00Z', isActive: false },
      { id: 'v-new', title: 'Newest Video', publishedAt: '2026-03-01T00:00:00Z', isActive: true },
    ])
    await signInAsAdmin(page, email)

    await expect(page.getByTestId('video-row')).toHaveCount(3, { timeout: 8000 })

    const titles = page.locator('[data-testid="video-row"] [data-testid="row-title"]')
    await expect(titles.nth(0)).toHaveText('Newest Video')
    await expect(titles.nth(1)).toHaveText('Middle Video')
    await expect(titles.nth(2)).toHaveText('Oldest Video')

    // Inactive row is visible (but dimmed — style check is for UAT)
    const toggleMiddle = page.getByTestId('toggle-active-v-mid')
    await expect(toggleMiddle).toBeVisible()
    await expect(toggleMiddle).toHaveAttribute('aria-checked', 'false')
  })

  // FT-3: Add Video form validates required fields
  test('FT-3: form shows inline errors for missing required fields and invalid duration', async ({
    page,
    request,
  }) => {
    const { email } = await setupAdminUser(request, 'ft3-admin')
    await signInAsAdmin(page, email)

    await page.getByTestId('btn-add-video').click()
    await expect(page.getByTestId('video-form-panel')).toBeVisible()

    // Submit without filling anything
    await page.getByTestId('btn-publish').click()
    await expect(page.getByTestId('error-youtubeVideoId')).toBeVisible()
    await expect(page.getByTestId('error-title')).toBeVisible()
    await expect(page.getByTestId('error-duration')).toBeVisible()

    // Invalid duration format
    await page.getByTestId('input-duration').fill('badformat')
    await page.getByTestId('input-duration').blur()
    await expect(page.getByTestId('error-duration')).toContainText('mm:ss')

    // Valid duration clears error
    await page.getByTestId('input-duration').fill('3:45')
    await page.getByTestId('input-duration').blur()
    await expect(page.getByTestId('error-duration')).not.toBeVisible()
  })

  // FT-4: Thumbnail URL auto-populated from YouTube ID on blur
  test('FT-4: thumbnail URL auto-populated from YouTube ID on blur', async ({
    page,
    request,
  }) => {
    const { email } = await setupAdminUser(request, 'ft4-admin')
    await signInAsAdmin(page, email)

    await page.getByTestId('btn-add-video').click()
    await page.getByTestId('input-youtubeVideoId').fill('dQw4w9WgXcQ')
    await page.getByTestId('input-youtubeVideoId').blur()

    await expect(page.getByTestId('input-thumbnailUrl')).toHaveValue(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      { timeout: 3000 },
    )
    await expect(page.getByTestId('thumbnail-preview')).toHaveAttribute(
      'src',
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
  })

  // FT-5: Successful publish → Firestore write + success toast + list refresh
  test('FT-5: successful publish writes to Firestore, shows toast, and refreshes list', async ({
    page,
    request,
  }) => {
    const { email } = await setupAdminUser(request, 'ft5-admin')
    await signInAsAdmin(page, email)

    await expect(page.getByTestId('video-row')).toHaveCount(0, { timeout: 5000 })

    await page.getByTestId('btn-add-video').click()
    await page.getByTestId('input-youtubeVideoId').fill('testVideoAbc')
    await page.getByTestId('input-title').fill('Test UAT Video')
    await page.getByTestId('input-category').selectOption('Rhymes')
    await page.getByTestId('input-duration').fill('3:00')
    await page.getByTestId('btn-publish').click()

    await expect(page.getByTestId('toast-success')).toContainText('Video published successfully', {
      timeout: 8000,
    })
    await expect(page.getByTestId('video-form-panel')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('video-row')).toHaveCount(1, { timeout: 8000 })
    await expect(page.locator('[data-testid="row-title"]')).toHaveText('Test UAT Video')
  })

  // FT-6: isActive toggle immediately updates Firestore
  test('FT-6: isActive toggle updates Firestore', async ({ page, request }) => {
    const { email } = await setupAdminUser(request, 'ft6-admin')
    await seedVideo(request, {
      id: 'toggle-video',
      title: 'Toggle Test',
      publishedAt: '2026-01-01T00:00:00Z',
      isActive: true,
    })
    await signInAsAdmin(page, email)

    await expect(page.getByTestId('video-row')).toHaveCount(1, { timeout: 8000 })
    const toggle = page.getByTestId('toggle-active-toggle-video')
    await expect(toggle).toHaveAttribute('aria-checked', 'true')

    // Toggle OFF
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false', { timeout: 5000 })

    const docOff = await getFirestoreDocument(request, 'videos', 'toggle-video')
    expect(docOff.fields.isActive.booleanValue).toBe(false)

    // Toggle ON
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'true', { timeout: 5000 })

    const docOn = await getFirestoreDocument(request, 'videos', 'toggle-video')
    expect(docOn.fields.isActive.booleanValue).toBe(true)
  })

  // FT-7: Send Notification writes to notifications collection
  test('FT-7: send notification writes doc to notifications collection', async ({
    page,
    request,
  }) => {
    const { email } = await setupAdminUser(request, 'ft7-admin')
    await signInAsAdmin(page, email)

    await page.getByTestId('input-notif-title').fill('New rhyme!')
    await page.getByTestId('input-notif-body').fill('Check it out')
    await page.getByTestId('input-notif-videoid').fill('abc123')
    await page.getByTestId('btn-send-notif').click()

    await expect(page.getByTestId('notification-status')).toBeVisible({ timeout: 5000 })

    // Verify Firestore write via REST
    const docs = await listFirestoreCollection(request, 'notifications')
    expect(docs.length).toBeGreaterThan(0)
    const notifDoc = docs[0]
    expect(notifDoc.fields.title.stringValue).toBe('New rhyme!')
    expect(notifDoc.fields.body.stringValue).toBe('Check it out')
    expect(notifDoc.fields.youtubeVideoId.stringValue).toBe('abc123')
    expect(notifDoc.fields.status.stringValue).toBe('pending')
    expect(notifDoc.fields.sentAt.nullValue).toBeNull()
  })

  // FT-8: Notification status updates in real-time
  test('FT-8: notification status updates in real-time when doc changes', async ({
    page,
    request,
  }) => {
    const { email } = await setupAdminUser(request, 'ft8-admin')
    await signInAsAdmin(page, email)

    await page.getByTestId('input-notif-title').fill('Live status test')
    await page.getByTestId('input-notif-body').fill('Body text')
    await page.getByTestId('btn-send-notif').click()

    // Initial status: pending / Sending...
    await expect(page.getByTestId('notification-status')).toBeVisible({ timeout: 5000 })

    // Find the notification doc in Firestore
    const docs = await listFirestoreCollection(request, 'notifications')
    expect(docs.length).toBe(1)
    const notifId = docs[0].name.split('/').pop() as string

    // Simulate Cloud Function: update status to 'sent'
    await patchFirestoreDocument(request, 'notifications', notifId, {
      status: { stringValue: 'sent' },
      sentAt: { timestampValue: new Date().toISOString() },
    })

    // UI should update in real-time without page reload
    await expect(page.getByTestId('notification-status')).toContainText('Sent', { timeout: 5000 })
  })
})
