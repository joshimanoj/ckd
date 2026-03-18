# PRD: Story #9 — Push Notifications (Web Pass)

**Branch:** feature/story-9-push-notifications-web
**Pass:** 1 — Web | **Type:** UI | **Sprint:** 3
**Tech stack:** React 18 + Vite + TypeScript | Vitest + React Testing Library | Playwright
**Design ref:** story-9-ui-context.md
**Output:** prd-9-web.md → completed/ when /check and /uat pass

---

## Track B — Functional Tests (write FIRST, start RED)

All FTs must be fully executable at write time — no stubs.
Playwright FTs require: Firebase Auth + Firestore emulators running (`FIREBASE_EMULATOR_RUNNING=1`).
FT-6 (Cloud Function) additionally requires Functions emulator.

---

### Functional Test FT-1: Opt-in sheet appears after first video end — not on launch

**Criterion (from story-9.md):** In-app opt-in prompt shown after first video completed; Android system notification permission dialog triggered only after in-app prompt (not on app launch)
**Test File:** `apps/web/e2e/story-9/notif-optin-sheet-appears.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed one video in Firestore emulator
- Sign in as test user with child profile + `notificationsEnabled: false`
- Navigate to `/watch/test-video-1`
- Inject `window.__mockFcmToken = 'test-fcm-token-001'` via `page.addInitScript`

**User Flow:**
1. Navigate to `/library` — assert `data-testid="notif-optin-sheet"` is NOT visible
2. Navigate to `/watch/test-video-1` — assert sheet NOT visible on initial load
3. Simulate video end via `page.evaluate(() => window.__simulateVideoEnd())`
4. Assert `data-testid="notif-optin-sheet"` becomes visible
5. Assert `data-testid="notif-accept-btn"` (min height 48px) is visible
6. Assert `data-testid="notif-dismiss-btn"` is visible

**Assertions:**
- `page.locator('[data-testid="notif-optin-sheet"]')` not visible on `/library`
- `page.locator('[data-testid="notif-optin-sheet"]')` not visible immediately on `/watch/test-video-1`
- After `__simulateVideoEnd()`: `page.locator('[data-testid="notif-optin-sheet"]')` toBeVisible()
- `page.locator('[data-testid="notif-accept-btn"]')` bounding box height >= 48

**Test skip guard:** `test.skip(!process.env['FIREBASE_EMULATOR_RUNNING'], 'Requires Firebase emulator')`

**Initial Status:** RED

---

### Functional Test FT-2: "Not now" dismisses sheet, notificationsEnabled stays false

**Criterion (from story-9.md):** If denied or "Not now": `notificationsEnabled: false` remains; no retry until parent enables via Settings
**Test File:** `apps/web/e2e/story-9/notif-dismiss.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed user doc with `notificationsEnabled: false`
- Navigate to `/watch/test-video-1`
- Simulate video end to show sheet

**User Flow:**
1. Simulate video end → sheet appears
2. Click `data-testid="notif-dismiss-btn"` ("Not now")
3. Assert sheet disappears
4. Navigate away and back to `/watch/test-video-1`, simulate video end again
5. Assert sheet does NOT appear again (localStorage flag `ckd_notif_prompted` prevents re-prompt)

**Assertions:**
- After dismiss: `page.locator('[data-testid="notif-optin-sheet"]')` not visible
- After second video end: sheet does NOT reappear
- Firestore `users/{uid}.notificationsEnabled` remains `false` (verify via emulator REST API)

**Initial Status:** RED

---

### Functional Test FT-3: "Yes, notify me" → Firestore: notificationsEnabled:true + fcmToken written

**Criterion (from story-9.md):** FCM token requested and written to `users/{uid}.fcmToken` on permission grant; `notificationsEnabled: true` on opt-in
**Test File:** `apps/web/e2e/story-9/notif-optin-firestore-write.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed user with `notificationsEnabled: false, fcmToken: null`
- Navigate to `/watch/test-video-1`
- Inject `window.__mockFcmToken = 'test-fcm-token-001'` via `page.addInitScript`
- Grant browser notification permission via `context.grantPermissions(['notifications'])`

**User Flow:**
1. Simulate video end → sheet appears
2. Click `data-testid="notif-accept-btn"` ("Yes, notify me")
3. Wait for sheet to dismiss (token write + Firestore update completes)
4. Verify Firestore document via emulator REST API

**Assertions:**
- `users/{uid}.notificationsEnabled` === `true`
- `users/{uid}.fcmToken` === `'test-fcm-token-001'`
- Sheet is no longer visible after accept

**Notes:**
- `window.__mockFcmToken` is injected via `page.addInitScript(() => { window.__mockFcmToken = 'test-fcm-token-001' })`
- `notificationService.ts` checks `(window as Record<string, unknown>)['__mockFcmToken']` as a test override before calling `getToken()` — consistent with existing `window.__simulateVideoEnd` test hook pattern

**Initial Status:** RED

---

### Functional Test FT-4: FCM token written/refreshed on each app open when permission granted

**Criterion (from story-9.md):** FCM token refreshed on each app open; `onTokenRefresh` listener (web: re-call `getToken()` on mount)
**Test File:** `apps/web/e2e/story-9/notif-token-refresh.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed user with `notificationsEnabled: true, fcmToken: 'old-token-000'`
- Inject `window.__mockFcmToken = 'refreshed-token-002'` via `page.addInitScript`
- Grant browser notification permission via `context.grantPermissions(['notifications'])`

**User Flow:**
1. Navigate to `/library` (app mounts, `useNotifications` runs)
2. Wait for app to fully load
3. Verify Firestore `users/{uid}.fcmToken` was updated

**Assertions:**
- `users/{uid}.fcmToken` === `'refreshed-token-002'` (updated from `'old-token-000'`)

**Notes:** `useNotifications` calls `getToken()` on mount when permission is already granted, compares with stored token, updates Firestore if different.

**Initial Status:** RED

---

### Functional Test FT-5: Settings tab notification toggle with Parental Gate enforcement

**Criterion (from story-9.md):** `notificationsEnabled` toggle in Settings updates Firestore in real-time; Parental Gate enforced before toggle
**Test File:** `apps/web/e2e/story-9/settings-toggle-parental-gate.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed user with `notificationsEnabled: false, fcmToken: 'test-token'`
- Sign in, navigate to `/library`
- Open Parent Panel (click parent icon) → Settings tab

**User Flow:**
1. Open Parent Panel → click Settings tab
2. Assert notification toggle is visible at `data-testid="notif-toggle"`
3. Click notification toggle
4. Assert Parental Gate modal appears (`data-testid="parental-gate"`)
5. Enter correct answer to math question
6. Assert toggle state changes to enabled
7. Verify Firestore `users/{uid}.notificationsEnabled === true`

**Assertions:**
- Parental Gate appears on toggle tap
- Without correct answer: toggle does not change
- After correct answer: toggle reflects new state
- Firestore `notificationsEnabled` matches toggle state

**Initial Status:** RED

---

### Functional Test FT-6: Cloud Function: notification doc created → status 'sent'

**Criterion (from story-9.md):** Cloud Function queries opted-in users, sends FCM multicast, updates notification document `sentAt`, `status: 'sent'`
**Test File:** `functions/src/__tests__/sendNotification.integration.test.ts`
**Framework:** Vitest (integration, Firebase Functions emulator)

**Setup:**
- Firebase Functions + Firestore emulators running
- Seed one user with `notificationsEnabled: true, fcmToken: 'valid-token-001'`
- Seed one user with `notificationsEnabled: false, fcmToken: 'should-not-receive'`
- Test uses `firebase-admin` SDK pointing to emulator

**Test Flow:**
1. Create a notification document in Firestore emulator:
   `notifications/{notifId}` with `{ title: 'New Rhyme!', body: 'Check it out', status: 'pending', createdAt: now }`
2. The `onNotificationCreated` Cloud Function trigger fires
3. Poll Firestore (max 5s, 500ms intervals) for `notifications/{notifId}.status`
4. Assert status is `'sent'`
5. Assert `sentAt` is a timestamp

**Assertions:**
- `notifications/{notifId}.status === 'sent'`
- `notifications/{notifId}.sentAt` is truthy (Timestamp)
- Only the opted-in user's token was targeted (verify via FCM mock or admin SDK response)

**Notes:**
- FCM sends are mocked in the Functions emulator — no real FCM delivery; function logic + Firestore update are verified
- Requires `FUNCTIONS_EMULATOR_RUNNING=1` guard:
  `if (!process.env['FUNCTIONS_EMULATOR_RUNNING']) { return }` at test top
- `firebase-functions-test` library used for wrapping the function

**Initial Status:** RED — requires Task 10 (Cloud Function setup) to compile

---

### Functional Test FT-7: Responsive layout — no horizontal scroll at < 480px

**Criterion (from story-9.md):** Renders correctly at 480–768px; no horizontal scroll at viewports < 480px
**Test File:** `apps/web/e2e/story-9/responsive.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed user with `notificationsEnabled: false`
- Simulate video end to show opt-in sheet

**User Flow:**
1. Set viewport to 375×812 (< 480px)
2. Navigate to `/library` — assert no horizontal overflow
3. Simulate video end on watch page — assert opt-in sheet renders within viewport, no overflow
4. Open Parent Panel → Settings tab — assert toggle visible, no overflow
5. Set viewport to 480×812 — repeat assertions

**Assertions:**
- `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (no horizontal scroll)
- `[data-testid="notif-optin-sheet"]` bounding box width <= viewport width
- `[data-testid="notif-accept-btn"]` is full-width within sheet (no clipping)

**Initial Status:** RED

---

## Track A — Implementation Tasks

---

### Task 1 of 10: notificationStore.ts — Zustand store

**Type:** Feature

**Files:**
- Test: `apps/web/src/shared/store/__tests__/notificationStore.test.ts`
- Implementation: `apps/web/src/shared/store/notificationStore.ts`

**What to Build:**
Zustand store for notification preference state. Mirrors pattern of existing stores (`authStore.ts`, `childProfileStore.ts`).

```ts
interface NotificationState {
  notificationsEnabled: boolean
  fcmToken: string | null
  promptShown: boolean   // whether opt-in sheet has been shown this session
  setNotificationsEnabled: (enabled: boolean) => void
  setFcmToken: (token: string | null) => void
  setPromptShown: (shown: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notificationsEnabled: false,
  fcmToken: null,
  promptShown: false,
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setFcmToken: (token) => set({ fcmToken: token }),
  setPromptShown: (shown) => set({ promptShown: shown }),
}))
```

**Edge cases:**
- Store initialises to `notificationsEnabled: false` — never assume opt-in at start
- `promptShown` is session-only (not persisted) — localStorage `ckd_notif_prompted` handles cross-session persistence

**Test Requirements:**
```ts
// should initialise with notificationsEnabled: false
// should update notificationsEnabled via setNotificationsEnabled
// should update fcmToken via setFcmToken
// should update promptShown via setPromptShown
```

**Implementation Notes:**
- Follow `authStore.ts` pattern — `create<T>()(...)` with zustand
- Export both `useNotificationStore` (hook) and the store object for testing

---

### Task 2 of 10: notificationService.ts — FCM service functions

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/notifications/services/__tests__/notificationService.test.ts`
- Implementation: `apps/web/src/features/notifications/services/notificationService.ts`

**What to Build:**

```ts
// Request web FCM token (with test hook escape hatch)
export async function requestWebFcmToken(): Promise<string | null>

// Write FCM token to Firestore (idempotent)
export async function writeFcmToken(uid: string, token: string): Promise<void>

// Update notificationsEnabled in Firestore
export async function updateNotificationsEnabled(uid: string, enabled: boolean): Promise<void>
```

`requestWebFcmToken` logic:
1. Check `window.__mockFcmToken` — return it if set (test hook, consistent with existing `__simulateVideoEnd` pattern)
2. Check `Notification.permission` — if not `'granted'`, return `null`
3. Register service worker: `navigator.serviceWorker.register('/firebase-messaging-sw.js')`
4. Call `getToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_KEY, serviceWorkerRegistration: swReg })`
5. Return token or `null` on failure

**Edge cases:**
- Service worker registration may fail (HTTPS required in prod; dev uses localhost which is allowed)
- `getToken()` returns `null` if permission not granted
- `updateDoc` is idempotent — same token written on repeat calls, no duplicate documents

**Test Requirements:**
```ts
// should return mock token when window.__mockFcmToken is set
// should return null when Notification.permission is 'denied'
// should call updateDoc with correct path on writeFcmToken
// should call updateDoc with notificationsEnabled: true on updateNotificationsEnabled(uid, true)
// should call updateDoc with notificationsEnabled: false on updateNotificationsEnabled(uid, false)
```

**Implementation Notes:**
- `vi.mock('firebase/messaging', ...)` in tests — mock `getToken`, `getMessaging`
- `vi.mock('firebase/firestore', ...)` for `updateDoc` assertions
- VAPID key from `import.meta.env.VITE_VAPID_KEY` — not checked for validity in service; env var required in production

---

### Task 3 of 10: useNotifications.ts — hook

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/notifications/hooks/__tests__/useNotifications.test.ts`
- Implementation: `apps/web/src/features/notifications/hooks/useNotifications.ts`

**What to Build:**
Custom hook that:
1. On mount: if `Notification.permission === 'granted'` → call `requestWebFcmToken()` → compare with stored token → `writeFcmToken()` if different; update store
2. Reads `notificationsEnabled` from notificationStore
3. Exposes `optIn()`: request browser permission → get FCM token → write to Firestore → set `notificationsEnabled: true` → update store
4. Exposes `optOut()`: update Firestore `notificationsEnabled: false` → update store

```ts
export function useNotifications(uid: string) {
  const { notificationsEnabled, fcmToken, setNotificationsEnabled, setFcmToken } =
    useNotificationStore()

  // On mount: refresh token if permission already granted
  useEffect(() => {
    if (!uid) return
    async function refreshToken() {
      const token = await requestWebFcmToken()
      if (token && token !== fcmToken) {
        await writeFcmToken(uid, token)
        setFcmToken(token)
      }
    }
    refreshToken()
  }, [uid])  // uid only — runs once per user session

  const optIn = useCallback(async () => {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return
    const token = await requestWebFcmToken()
    if (!token) return
    await writeFcmToken(uid, token)
    await updateNotificationsEnabled(uid, true)
    setFcmToken(token)
    setNotificationsEnabled(true)
  }, [uid])

  const optOut = useCallback(async () => {
    await updateNotificationsEnabled(uid, false)
    setNotificationsEnabled(false)
  }, [uid])

  return { notificationsEnabled, optIn, optOut }
}
```

**Edge cases:**
- `uid` is empty string on mount before auth loads — guard with `if (!uid) return`
- `Notification` API does not exist in test env — guard with `typeof Notification !== 'undefined'`
- Token refresh: only update Firestore if new token differs from stored

**Test Requirements:**
```ts
// should call requestWebFcmToken on mount when Notification.permission is 'granted'
// should not call requestWebFcmToken when uid is empty
// optIn: should call Notification.requestPermission(), then writeFcmToken, then updateNotificationsEnabled
// optIn: should not update store if permission denied
// optOut: should call updateNotificationsEnabled(uid, false) and update store
```

**Implementation Notes:**
- Mock all service functions with `vi.mock`
- Test with `renderHook` from `@testing-library/react`

---

### Task 4 of 10: NotificationOptInSheet.tsx — animated bottom sheet

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/notifications/components/__tests__/NotificationOptInSheet.test.tsx`
- Implementation: `apps/web/src/features/notifications/components/NotificationOptInSheet.tsx`

**What to Build:**

```tsx
interface NotificationOptInSheetProps {
  visible: boolean
  onAccept: () => Promise<void>
  onDismiss: () => void
}
```

Design spec (from story-9-ui-context.md):
- Overlay: `position: fixed, inset: 0, background: rgba(0,0,0,0.4), zIndex: 300`
- Sheet: slides up from bottom, `borderRadius: '24px 24px 0 0'`, background `#FAFAFA`
- Drag handle, bell icon `🔔` in brand purple `#9333EA` at 32px
- Title: `"Get notified about new rhymes!"` — Baloo 2 Bold 20sp, `#1E1B4B`
- Subtitle: `"We'll let you know when new videos are added."` — Nunito 14sp, `#6B7280`
- "Yes, notify me" button: `data-testid="notif-accept-btn"`, background `#F43F5E`, pill, 48dp min height, full-width
- "Not now" button: `data-testid="notif-dismiss-btn"`, ghost style, violet label, 48dp min height

State:
- `loading: boolean` — set true on accept click; button shows spinner and is disabled
- Reset to false on completion or error

Animation: CSS `@keyframes slide-up` on sheet element when `visible: true`.
When `visible: false`: `display: none` (avoid animation on mount).

**Test Requirements:**
```ts
// should not render when visible is false
// should render overlay and sheet when visible is true
// should call onDismiss when "Not now" is clicked
// should call onAccept when "Yes, notify me" is clicked
// should show loading state while onAccept is in progress
// "Yes, notify me" button bounding box height should be >= 48px
// should be full-width (button width === sheet width minus padding)
```

**Implementation Notes:**
- `data-testid` on overlay (`notif-overlay`), sheet (`notif-optin-sheet`), accept btn (`notif-accept-btn`), dismiss btn (`notif-dismiss-btn`)

---

### Task 5 of 10: firebase-messaging-sw.js — service worker

**Type:** Feature

**Files:**
- Implementation: `apps/web/public/firebase-messaging-sw.js`

**What to Build:**
Web FCM service worker — handles background push notifications when browser tab is not in focus.

```js
// apps/web/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  projectId: self.FIREBASE_PROJECT_ID,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
})

const messaging = firebase.messaging()

// Handle background messages — show notification
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'Choti Ki Duniya', {
    body: body ?? '',
    icon: '/icon.png',
  })
})

// Notification click → open app to /library
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow('/library')
    }),
  )
})
```

**Notes:**
- Firebase config values are injected at build time or via `vite-plugin-pwa` / manual injection
- In development: service worker uses `VITE_` env vars — but service workers cannot access `import.meta.env` directly; the values must be inlined at build time via Vite plugin or a separate script
- **Simple approach for V1**: hardcode the Firebase config values in the service worker (Firebase config is intentionally public — security is via Firestore Rules) or use a build-time substitution script
- This file has no automated unit test — manually verified in browser DevTools → Application → Service Workers
- Document in `Known Test Gaps` below

**Edge cases:**
- Service worker registration fails on HTTP (non-localhost) — prod uses HTTPS (Firebase Hosting) so this is only a local dev concern
- Service worker must be at `/firebase-messaging-sw.js` (root of origin) — placing in `public/` satisfies this for Vite

---

### Task 6 of 10: Update WatchPage.tsx — trigger opt-in after first video end

**Type:** Feature

**Files:**
- Test: `apps/web/src/pages/__tests__/WatchPage.notifications.test.tsx`
- Implementation: `apps/web/src/pages/WatchPage.tsx` (update)

**What to Build:**
Add notification opt-in prompt trigger to WatchPage:

1. Import `useNotifications` hook and `NotificationOptInSheet` component
2. Add `showNotifPrompt: boolean` state
3. Modify `handleVideoEnd`: after flushing session and before navigating, if `!notificationsEnabled && !localStorage.getItem('ckd_notif_prompted')` → set `showNotifPrompt = true` instead of immediately navigating
4. `handleNotifAccept`: calls `optIn()`, sets `localStorage.setItem('ckd_notif_prompted', '1')`, sets `showNotifPrompt = false`, then navigates to next video
5. `handleNotifDismiss`: sets localStorage flag, sets `showNotifPrompt = false`, navigates to next video
6. Render `<NotificationOptInSheet visible={showNotifPrompt} onAccept={handleNotifAccept} onDismiss={handleNotifDismiss} />` after `<PlayerScreen>`

**Edge cases:**
- `localStorage.getItem('ckd_notif_prompted')` — if already set, never show sheet again
- If user is already opted in (`notificationsEnabled: true`) — skip sheet
- Navigation after sheet: the `nextVideoId` must be captured before showing the sheet (captured in `handleVideoEnd` closure)

**Test Requirements:**
```ts
// should show opt-in sheet after first video end when not prompted before
// should NOT show opt-in sheet when ckd_notif_prompted is already set in localStorage
// should NOT show opt-in sheet when notificationsEnabled is already true
// should navigate to next video after accept
// should navigate to next video after dismiss
```

**Implementation Notes:**
- `useNotifications` is called at the top of `WatchPage` with `user?.uid ?? ''`
- `nextVideoIdRef = useRef<string | null>(null)` captures the next video ID for navigation after sheet closes
- This keeps PlayerScreen decoupled from notification logic

---

### Task 7 of 10: SettingsScreen.tsx — notification toggle + Parental Gate

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/notifications/components/__tests__/SettingsScreen.test.tsx`
- Implementation: `apps/web/src/features/notifications/components/SettingsScreen.tsx`

**What to Build:**

```tsx
interface SettingsScreenProps {
  uid: string
}
```

Contents:
1. Section heading: `"Notifications"` (Baloo 2 Bold 16sp, `#1E1B4B`)
2. Toggle row: label `"New video alerts"` + sublabel + styled toggle (`<input type="checkbox" role="switch">`)
3. Lock note: `🔒 "Requires parent verification"` (Nunito 13sp, `#6B7280`)
4. Privacy Policy link placeholder (disabled, Story 10 will provide URL)
5. Uses `useNotifications(uid)` for `notificationsEnabled`, `optIn`, `optOut`
6. Uses `useParentalGate()` hook for gate enforcement

Toggle tap flow:
1. `handleToggleTap()` → call `openGate()`
2. On gate pass: if `!notificationsEnabled` → `optIn()`, else `optOut()`
3. Show success toast (3s, green `#22C55E`) on success
4. On gate dismiss: no change

**Test Requirements:**
```ts
// should render notification toggle matching notificationsEnabled state
// should open Parental Gate when toggle is tapped
// should NOT change toggle state if gate is dismissed
// should call optIn() when gate passes and notificationsEnabled is false
// should call optOut() when gate passes and notificationsEnabled is true
// Privacy Policy link should be present (even if disabled/placeholder)
```

**Implementation Notes:**
- Import `useParentalGate` from `apps/web/src/shared/hooks/useParentalGate.ts`
- Toast: inline state `toastVisible: boolean`, auto-hide after 3000ms via `setTimeout`
- `data-testid="notif-toggle"` on the toggle input/div
- `data-testid="settings-screen"` on root container

---

### Task 8 of 10: Update ParentPanel.tsx — wire SettingsScreen

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/dashboard/components/__tests__/ParentPanel.settings.test.tsx`
- Implementation: `apps/web/src/features/dashboard/components/ParentPanel.tsx` (update)

**What to Build:**
Replace `SettingsPlaceholder` with `SettingsScreen` component.

Changes:
1. Remove the `SettingsPlaceholder` function
2. Import `SettingsScreen` from `apps/web/src/features/notifications/components/SettingsScreen`
3. Add `uid` to `ParentPanelProps` (it already receives `uid` — confirm it does: yes, `{ db, uid, childProfileId, onClose }`)
4. Replace `<SettingsPlaceholder />` with `<SettingsScreen uid={uid} />`

**Test Requirements:**
```ts
// should render SettingsScreen (not placeholder) in settings tab
// should render DashboardScreen in dashboard tab (unchanged)
// SettingsScreen should be accessible when Settings tab is active
```

**Implementation Notes:**
- Minimal change — only swap the component. No layout changes.
- `data-testid="settings-tab-content"` can be added to verify which content renders

---

### Task 9 of 10: Update authService.ts — write FCM token on sign-in

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/services/__tests__/authService.test.ts` (update)
- Implementation: `apps/web/src/features/auth/services/authService.ts` (update)

**What to Build:**
On sign-in completion, if notification permission is already granted, attempt to get and write the FCM token. This handles the case where a user re-installs or clears browser storage but has previously granted permission.

Add to `createUserDoc` or as a separate call after sign-in in `useAuth`:

```ts
export async function refreshFcmTokenAfterSignIn(uid: string): Promise<void> {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  const token = await requestWebFcmToken()
  if (token) {
    await updateDoc(doc(db, 'users', uid), { fcmToken: token })
  }
}
```

Call this from `useAuth` after `createUserDoc` completes on sign-in.

**Edge cases:**
- `Notification` API not available (SSR, test env) — guard
- Permission not granted — no-op
- `requestWebFcmToken` fails silently — catch and log, do not block sign-in

**Test Requirements:**
```ts
// should call updateDoc with fcmToken when permission is 'granted'
// should NOT call updateDoc when Notification.permission is 'default'
// should NOT call updateDoc when Notification.permission is 'denied'
// should not throw if requestWebFcmToken throws (best-effort)
```

**Implementation Notes:**
- Import `requestWebFcmToken` from `notificationService` — circular dep check: auth → notification is fine (notification does not import auth)
- Wrap the call in try/catch — sign-in must succeed regardless of FCM token state

---

### Task 10 of 10: Cloud Function setup — sendNotification.ts

**Type:** Feature

**Files:**
- Test: `functions/src/__tests__/sendNotification.integration.test.ts`
- Implementation: `functions/src/sendNotification.ts`
- New: `functions/package.json`, `functions/tsconfig.json`

**What to Build:**

`functions/package.json`:
```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  },
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "~5.4.0",
    "firebase-functions-test": "^3.3.0",
    "vitest": "^1.6.0"
  }
}
```

`functions/src/sendNotification.ts`:
```ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

initializeApp()
const db = getFirestore()

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export const onNotificationCreated = onDocumentCreated(
  'notifications/{notificationId}',
  async (event) => {
    const data = event.data?.data()
    if (!data) return

    const { title, body } = data as { title: string; body: string }

    const usersSnap = await db.collection('users')
      .where('notificationsEnabled', '==', true).get()

    const tokens: string[] = usersSnap.docs
      .map((d) => d.data()['fcmToken'] as string | null)
      .filter((t): t is string => Boolean(t))

    let status: 'sent' | 'failed' = 'sent'
    try {
      for (const chunk of chunkArray(tokens, 500)) {
        await getMessaging().sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
        })
      }
    } catch {
      status = 'failed'
    }

    await event.data!.ref.update({
      sentAt: FieldValue.serverTimestamp(),
      status,
    })
  },
)
```

`functions/src/index.ts`:
```ts
export { onNotificationCreated } from './sendNotification'
```

**Edge cases:**
- Zero opted-in users: `tokens` is empty → FCM send is skipped, `status: 'sent'` still written
- Stale/invalid tokens: FCM returns per-token errors; function logs and continues (does not rethrow)
- > 500 tokens: `chunkArray` batches into 500-token chunks (V1 scale won't hit this, but implemented)
- `event.data` is null (document deleted race): guard with `if (!data) return`

**Test Requirements (FT-6 in `functions/src/__tests__/sendNotification.integration.test.ts`):**
```ts
// should update notification doc status to 'sent' after function fires
// should set sentAt timestamp on completion
// should handle zero opted-in users gracefully (status: 'sent', no FCM call)
// should exclude users with notificationsEnabled: false from FCM send
```

**Implementation Notes:**
- `functions/tsconfig.json`: `{ "compilerOptions": { "module": "commonjs", "target": "es2020", "strict": true, "outDir": "lib" }, "include": ["src"] }`
- `firebase.json` must include `"functions": { "source": "functions" }` — update if not present
- Cloud Function deployed with `firebase deploy --only functions` — not automated in CI for V1 (manual deploy step)

---

## Known Test Gaps

| Gap | Reason | Resolution |
|---|---|---|
| `firebase-messaging-sw.js` not unit tested | Service workers cannot run in jsdom/vitest env | Manually verified in browser DevTools; Playwright smoke test covers notification click behavior in FT tests |
| Actual FCM push delivery not tested | FCM delivery requires production Firebase project + real device tokens | Mocked via `window.__mockFcmToken`; FCM delivery is Google's infrastructure responsibility |
| `onTokenRefresh` native listener | Web FCM does not expose a push listener for token rotation; handled by re-calling `getToken()` on mount | Covered by FT-4 (mount-time token refresh) |

---

## Environment Variable Requirements

Add to `apps/web/.env.local` (not committed):
```
VITE_VAPID_KEY=<your-web-push-certificate-key-pair-from-firebase-console>
```

**Where to find it:** Firebase Console → Project Settings → Cloud Messaging → Web configuration → Key pair

---

## Firestore Write Summary

| Field | Collection | Written by | Trigger |
|---|---|---|---|
| `fcmToken` | `users/{uid}` | `writeFcmToken()` | Opt-in, app mount (if granted), sign-in |
| `notificationsEnabled` | `users/{uid}` | `updateNotificationsEnabled()` | Opt-in, opt-out, settings toggle |
| `sentAt` | `notifications/{id}` | Cloud Function | `onDocumentCreated` trigger |
| `status` | `notifications/{id}` | Cloud Function | `onDocumentCreated` trigger |
