# Story #10: Settings Screen & Privacy Policy Link | Type: UI | Pass: Web

---

## Track B — Functional Tests (write FIRST, start RED)

- [~] FT-1: Privacy Policy link is active and opens in new tab — `e2e/story-10/privacy-policy-link.spec.ts` — RED (written)
- [~] FT-2: Sign Out button shows confirmation dialog — `e2e/story-10/sign-out-dialog.spec.ts` — RED (written)
- [~] FT-3: Confirming Sign Out redirects to sign-in screen — `e2e/story-10/sign-out-confirm.spec.ts` — RED (written)
- [~] FT-4: Cancelling Sign Out keeps user on Settings — `e2e/story-10/sign-out-cancel.spec.ts` — RED (written)
- [~] FT-5: App version text is displayed — `e2e/story-10/app-version.spec.ts` — RED (written)
- [~] FT-6: Settings renders without overflow at 480px width — `e2e/story-10/responsive.spec.ts` — RED (written)

---

## Track A — Implementation Tasks

- [ ] Task 1: Add `reset()` to authStore and notificationStore — `authStore.ts`, `notificationStore.ts` — 5 min
- [ ] Task 2: Add `signOut` function to `useAuth` hook — `useAuth.ts` — 7 min
- [ ] Task 3: Correct notification toggle labels in SettingsScreen — `SettingsScreen.tsx` — 5 min
- [ ] Task 4: Activate Privacy Policy link with env constant + correct styling — `SettingsScreen.tsx` — 7 min
- [ ] Task 5: Add Sign Out row + confirmation dialog to SettingsScreen — `SettingsScreen.tsx`, `ParentPanel.tsx` — 10 min
- [ ] Task 6: Add version footer, polish section layout, verify responsive — `SettingsScreen.tsx` — 8 min

---

## Integration Check

- [ ] Full unit test suite passing (`vitest run` in `apps/web/`)
- [ ] TypeScript clean (`tsc --noEmit`)
- [ ] Lint clean (`eslint .`)
- [ ] All 6 FT tasks GREEN (with `FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-10/`)
- [ ] All acceptance criteria in story-10.md verified

---

## Story Acceptance

- [ ] Ready for /check
