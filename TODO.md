# Story #9: Push Notifications | Type: UI | Web Pass

---

## Track B — Functional Tests (write FIRST, start RED)

- [x] FT-1: Opt-in sheet appears after first video end — not on app load — `apps/web/e2e/story-9/notif-optin-sheet-appears.spec.ts` — 8 min
- [x] FT-2: "Not now" dismisses sheet, `notificationsEnabled` stays false — `apps/web/e2e/story-9/notif-dismiss.spec.ts` — 6 min
- [x] FT-3: "Yes, notify me" → Firestore: `notificationsEnabled:true` + `fcmToken` written — `apps/web/e2e/story-9/notif-optin-firestore-write.spec.ts` — 8 min
- [x] FT-4: FCM token written/refreshed on app mount when permission granted — `apps/web/e2e/story-9/notif-token-refresh.spec.ts` — 7 min
- [x] FT-5: Settings tab notification toggle with Parental Gate enforcement — `apps/web/e2e/story-9/settings-toggle-parental-gate.spec.ts` — 8 min
- [x] FT-6: Cloud Function: notification doc created → `status:'sent'` (Vitest integration, Functions emulator) — `functions/src/__tests__/sendNotification.integration.test.ts` — 10 min
- [x] FT-7: Responsive layout — no horizontal scroll at < 480px — `apps/web/e2e/story-9/responsive.spec.ts` — 6 min

---

## Track A — Implementation Tasks

- [x] Task 1: `notificationStore.ts` — Zustand store (notificationsEnabled, fcmToken, promptShown) — 5 min
- [x] Task 2: `notificationService.ts` — requestWebFcmToken, writeFcmToken, updateNotificationsEnabled — 8 min
- [x] Task 3: `useNotifications.ts` — hook: token refresh on mount, optIn(), optOut() — 8 min
- [x] Task 4: `NotificationOptInSheet.tsx` — animated bottom sheet, bell icon, "Yes"/"Not now" buttons — 8 min
- [x] Task 5: `firebase-messaging-sw.js` — service worker, background message, notification click → /library — 6 min
- [x] Task 6: Update `WatchPage.tsx` — show opt-in sheet after first video end — 7 min
- [x] Task 7: `SettingsScreen.tsx` — notification toggle + Parental Gate + success toast — 8 min
- [x] Task 8: Update `ParentPanel.tsx` — replace SettingsPlaceholder with SettingsScreen — 4 min
- [x] Task 9: Update `authService.ts` — `refreshFcmTokenAfterSignIn()` called after sign-in — 5 min
- [x] Task 10: Cloud Function — `functions/package.json` + `functions/src/sendNotification.ts` + `functions/src/index.ts` — 10 min

---

## Integration Check

- [x] Full unit test suite passing: `npm run test:all` in `apps/web/` (227 pass, 1 pre-existing failure in useAuth unrelated to Story 9)
- [ ] All FT tasks GREEN (Playwright + Vitest integration)
- [x] All acceptance criteria from story-9.md verified
- [x] `VITE_VAPID_KEY` documented in `.env.example` (value not committed)
- [x] `firebase.json` updated with `"functions": { "source": "functions" }` if not present

## Story Acceptance

- [ ] Ready for /check
