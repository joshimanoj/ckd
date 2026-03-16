# Story 9: Push Notifications

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 3 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent who has opted in to notifications
I want to receive a push notification when a new Choti Ki Duniya video is published
So that I never miss new content and am prompted to open the app

---

### Context

Push notifications are the re-engagement engine for the app — they turn a passive install into an active viewing habit. The flow is: admin publishes a video + triggers notification → Cloud Function queries opted-in users → FCM multicast send → parent's device receives notification → tap opens app to Video Library (new video at top). Opt-in is explicit and defaulted to off, as required by Google Play Families Policy.

This story implements the FCM token registration, opt-in prompt, notification permissions, Zustand preference state, and the Cloud Function that sends multicast FCM. The admin trigger is implemented in Story 6 (Notification Panel).

---

### Problem Statement

**Current State:** Parents only discover new videos by actively returning to the app or checking YouTube. No proactive re-engagement mechanism.

**Pain Points:**
- Parents forget to open the app between viewing sessions
- No awareness of new content until they actively search
- Low return visit rate without a trigger

**Desired State:** Parent taps "Allow" on Android notification permission prompt → new videos trigger a notification → parent taps notification → new video is at the top of the library.

---

### User Flow

**Trigger A (first video watched):** After the first video is completed, a notification opt-in prompt appears as an in-app bottom sheet before the Android system permission dialog.

**In-app opt-in flow:**
1. After first watch session ends → in-app bottom sheet: "Stay updated on new rhymes! Turn on notifications?"
2. Two buttons: "Yes, notify me" (primary) and "Not now" (ghost)
3. "Yes, notify me" → triggers `expo-notifications` permission request → Android system dialog
4. If granted: FCM token registered + `fcmToken` written to `users/{uid}` + `notificationsEnabled: true` written
5. If denied or "Not now": `notificationsEnabled: false` remains; no retry until parent enables via Settings (Story 10)

**Notification received flow:**
1. Admin writes to `notifications` collection (Story 6 — Notification Panel)
2. Cloud Function `onDocumentCreated` trigger fires
3. Cloud Function queries `users` where `notificationsEnabled == true` → collects all `fcmToken` values
4. FCM multicast send to all tokens (batched: max 500 per FCM API call)
5. Cloud Function updates notification document: `sentAt: now()`, `status: 'sent'` (or `'failed'` on error)
6. Parent's device displays notification: title + body from notification document
7. Parent taps notification → app opens → deep links to Video Library (new video at top, sorted by `publishedAt DESC`)

**Settings toggle (Story 10 pre-req):**
- Parent can toggle notifications on/off from Settings screen
- On toggle: updates `notificationsEnabled` in Firestore + manages local permission state

**Alternatives / Error States:**
- Permission denied at Android level → in-app preference stays `false`; Settings toggle directs parent to Android Settings if they change their mind later
- FCM token null (permission never granted) → user excluded from FCM send silently
- Cloud Function fails → notification document status set to `'failed'`; retry is manual (admin re-sends)

---

### Acceptance Criteria

**Functional:**
- [ ] FCM token requested and written to `users/{uid}.fcmToken` on permission grant
- [ ] `notificationsEnabled: false` by default — parent must explicitly opt in
- [ ] In-app opt-in prompt shown after first video completed
- [ ] Android system notification permission dialog triggered only after in-app prompt (not on app launch)
- [ ] FCM token refreshed on each app open (token may rotate — `onTokenRefresh` listener)
- [ ] Cloud Function: queries all users where `notificationsEnabled == true`
- [ ] Cloud Function: sends FCM multicast to all `fcmToken` values
- [ ] Cloud Function: updates notification document `sentAt`, `status` on completion
- [ ] Tapping notification → app opens to Video Library (not a deep-link to specific video in V1; specific video deep-link is V1.1)
- [ ] `notificationsEnabled` toggle in Settings (Story 10) updates Firestore in real-time

**Non-Functional:**
- [ ] FCM send batched: max 500 tokens per FCM multicast API call (handle > 500 users in V2 — not expected at V1 scale)
- [ ] Cloud Function cold start not a user-facing concern (async send — seconds of latency acceptable)
- [ ] In-app opt-in prompt: "Yes" button minimum 48dp, full-width
- [ ] FCM token write is idempotent (same token written on repeat opens — no duplicate documents)
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] Parent dismisses Android permission dialog → `notificationsEnabled` stays `false`; no in-app crash
- [ ] FCM token rotates → `onTokenRefresh` listener updates `users/{uid}.fcmToken` in Firestore
- [ ] User uninstalls and reinstalls → new FCM token registered on fresh install
- [ ] Stale/invalid FCM tokens in Cloud Function → FCM API returns error per token; function logs and continues (does not block entire send)

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 4 (Flow 4 — Notification receipt), 7 (Interaction Patterns — Feedback), product_note.md Feature 5

**Key UI Elements:**
- In-app opt-in bottom sheet:
  - 24dp top border-radius, `#FAFAFA` background, drag handle
  - Notification bell icon (brand purple, 32dp)
  - Title: "Get notified about new rhymes!" — Baloo 2 Bold 20sp, `#1E1B4B`
  - Subtitle: "We'll let you know when new videos are added." — Nunito Regular 14sp, `#6B7280`
  - "Yes, notify me" button: coral-red `#F43F5E`, pill, 48dp height, full-width
  - "Not now" button: ghost style, violet label, below primary button
- Push notification (system-level): title + body from notification document; app icon as notification icon

**Visual Requirements:**
- Opt-in prompt appears after video ends — not on cold app launch (reduces friction + provides context)
- No urgency language ("Act now!") — warm and informative tone

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/notifications/hooks/useNotifications.ts` (new)
- `apps/mobile/src/features/notifications/services/notificationService.ts` (new)
- `apps/mobile/src/features/videoPlayer/components/PlayerScreen.tsx` (update: show opt-in prompt on first video end)
- `apps/mobile/src/features/auth/services/authService.ts` (update: write FCM token on sign-in)
- Cloud Function: `functions/src/sendNotification.ts` (new — Node.js 20, FCM multicast)
- `packages/shared/src/types/user.ts` (fcmToken, notificationsEnabled fields)

**Dependencies:**
- Story 1 (Auth) must be complete — `users/{uid}` document must exist for FCM token write
- Story 7 (Player) must be complete — opt-in prompt triggers on first video end
- Story 6 (Admin Panel) must be complete — notification send trigger in Notification Panel
- Story 10 (Settings) must be complete — toggle uses `useNotifications` hook

**Cloud Function:**
```ts
// functions/src/sendNotification.ts
export const onNotificationCreated = onDocumentCreated(
  'notifications/{notificationId}',
  async (event) => {
    const { title, body } = event.data!.data()
    const usersSnap = await db.collection('users')
      .where('notificationsEnabled', '==', true).get()
    const tokens = usersSnap.docs
      .map(d => d.data().fcmToken).filter(Boolean)
    // Batch into chunks of 500
    for (const chunk of chunkArray(tokens, 500)) {
      await messaging().sendEachForMulticast({ tokens: chunk, notification: { title, body } })
    }
    await event.data!.ref.update({ sentAt: FieldValue.serverTimestamp(), status: 'sent' })
  }
)
```

**FCM token management:**
```ts
// On app open
const token = await messaging().getToken()
await updateDoc(doc(db, 'users', uid), { fcmToken: token })

// Token refresh listener
messaging().onTokenRefresh(async (token) => {
  await updateDoc(doc(db, 'users', uid), { fcmToken: token })
})
```

**Compliance note:**
- `notificationsEnabled` defaults to `false` — required by Google Play Families Policy
- FCM token stored only in `users/{uid}` document — not shared with any third party
- In-app opt-in prompt shown before Android system dialog (gives parent context)

---

### Complexity & Effort

**Score:** 3 (2–3 days)
**Estimated Tasks:** ~10 atomic tasks
**Risk Factors:**
- Cloud Function deployment requires Firebase Blaze plan (pay-as-you-go) — confirm with founder before Sprint 3 begins
- `@react-native-firebase/messaging` in Expo managed workflow: requires Expo config plugin (`expo-build-properties`) — verify compatibility
- FCM token rotation handling must be tested on physical device (emulator limitations for FCM)
- Android 13+ requires explicit notification permission (API 33) — `expo-notifications` handles this but must be tested

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- Cloud Function `functions/src/sendNotification.ts` — written once, platform-agnostic
- `packages/shared/src/types/user.ts` — fcmToken, notificationsEnabled fields (already defined)

**[WEB] — Pass 1 only:**
- `apps/web/src/features/notifications/hooks/useNotifications.ts` (Firebase JS SDK web FCM)
- FCM web token registration via Firebase JS SDK (`getToken()`)
- In-app opt-in prompt component (HTML/CSS bottom sheet)
- Web push notification permission (`Notification.requestPermission()`)

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/notifications/hooks/useNotifications.ts` (`@react-native-firebase/messaging`)
- `apps/mobile/src/features/notifications/services/notificationService.ts`
- `expo-notifications` permission request (Android 13+ explicit permission)
- FCM native token registration
- `onTokenRefresh` listener (native FCM)
- Note: Cloud Function already deployed in Pass 1 — no re-deployment needed

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-9-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-9-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-9-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-9-native.md` → `completed/`
- [ ] Both passes complete → `story-9.md` → `completed/`
