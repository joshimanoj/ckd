# Handover — Choti Ki Duniya

---

## Checkpoint: Story #1 Google Sign-In & Authentication | 2026-03-16 14:55 | /check PASSED

Story complete: Full auth flow implemented for web — OnboardingPage, GoogleSignInButton, useAuth hook, authService, authStore, AuthGuard, React Router v6, shared User type + Firebase collection refs.

**Files changed:**
- `packages/shared/src/types/user.ts` — User interface + isUser() type guard
- `packages/shared/src/firebase/config.ts` — Firebase init with emulator support
- `packages/shared/src/firebase/collections.ts` — typed Firestore refs with withConverter
- `apps/web/src/shared/store/authStore.ts` — Zustand auth store (user, loading)
- `apps/web/src/features/auth/services/authService.ts` — signInWithGoogle, signOutUser, createUserDoc, getUserDoc, subscribeToAuthState
- `apps/web/src/features/auth/hooks/useAuth.ts` — auth state listener + routing logic (routeTo)
- `apps/web/src/features/auth/components/GoogleSignInButton.tsx` — idle/loading/error states
- `apps/web/src/shared/components/AuthGuard.tsx` — routing guard using useAuth
- `apps/web/src/shared/components/LoadingSpinner.tsx` — brand purple spinner
- `apps/web/src/pages/OnboardingPage.tsx` — sign-in screen with offline state
- `apps/web/src/router.tsx` + `App.tsx` — React Router v6 + RouterProvider
- `apps/web/e2e/story-1/` — 7 Playwright E2E spec files
- `apps/web/vitest.config.ts`, `vite.config.ts`, `playwright.config.ts` — test infrastructure
- `apps/web/tsconfig.app.json` — added @ckd/shared path alias

**Test results:**
- 12 unit tests: ✅ 12/12 passing
- E2E (Playwright): ✅ 8/8 passing, 6 skipped (FT-2/3/4/5 require Firebase emulator)
- Type check: ✅ 0 errors
- Lint: ✅ 0 errors

**Decisions made:**
- `@ckd/shared` path alias configured in both vite.config.ts and vitest.config.ts; `resolve.dedupe: ['firebase']` prevents dual Firebase instances across shared package and web app
- `AuthGuard` extracted to its own file (`shared/components/AuthGuard.tsx`) to keep `router.tsx` lint-clean (react-refresh rule)
- `routeTo` computed in `useAuth` as local `useState` — not stored in Zustand (authStore stays minimal per spec)
- FT-2/3/4/5 E2E tests use `test.skip(FIREBASE_EMULATOR_RUNNING)` guard — they run in CI when emulator is available
- Firebase `onAuthStateChanged` does NOT require a real API key to fire with null — dummy test config is sufficient for render/responsive tests

**Warnings / debt:**
- `packages/shared/package.json` includes Firebase as a direct dependency which causes version duplication; long-term fix is npm workspaces at root level with hoisted Firebase. For now, `dedupe` in vite.config works.
- FT-7 "network failure error message" is tested via unit test (GoogleSignInButton + OnboardingPage), not in Playwright (requires MSW to mock ES module imports)
- Branch: `feature/story-1-auth-web` pushed to https://github.com/joshimanoj/ckd

**Next:** Story #1 — run `/uat` for human visual sign-off before merging. Story #2 (DPDP Consent Flow) begins after UAT passes.

---

## Checkpoint: Story #1 Google Sign-In & Authentication | 2026-03-16 | /uat APPROVED

UAT sign-off by Manoj. All 8 flows verified manually in Chrome (iPhone XR viewport, Firebase emulator).

**UAT fixes applied this session:**
- `apps/web/src/index.css` — added missing `@keyframes spin`; removed Vite boilerplate from `#root` (`width: 1126px`, `border-inline`, `text-align`, `margin: 0 auto`) that was breaking mobile-first layout
- `apps/web/src/shared/components/LoadingSpinner.tsx` — added brand gradient background + white ring so spinner is visible during auth resolution

**Next:** Story #2 DPDP Parental Consent Flow | Ready for: `/prd`

---

## Checkpoint: Story #2 DPDP Parental Consent Flow | 2026-03-16 17:42 | /check PASSED

Story complete: Non-dismissable ConsentModal with DPDP-compliant unchecked checkbox, `serverTimestamp()` Firestore write, error toast on failure, and browser back-button lock. Router wired at `/consent`.

**Files changed:**
- `apps/web/src/shared/store/authStore.ts` — added `RouteTo` type + `routeTo` + `setRouteTo` to Zustand (persists route across component mounts)
- `apps/web/src/features/auth/hooks/useAuth.ts` — reads `routeTo` from Zustand; skips Firestore re-resolution when same user re-subscribes (prevents stale cache redirect loop)
- `apps/web/src/features/auth/services/authService.ts` — added `recordConsent(uid)` using `updateDoc` + `serverTimestamp()`
- `apps/web/src/features/auth/components/ConsentModal.tsx` — full modal: checkbox gate, popstate back-button blocker, submit handler, error toast
- `apps/web/src/router.tsx` — `/consent` route wired to `<ConsentModal />`
- `apps/web/e2e/story-2/` — 7 Playwright E2E specs (FT-1 through FT-7)

**Test results:**
- Unit tests: ✅ 19/19 passing
- E2E Story 2: ✅ 9/9 passing
- E2E Story 1 regression: ✅ 14/14 passing
- Type check: ✅ 0 errors | Lint: ✅ 0 errors

**Decisions made:**
- `routeTo` moved to Zustand to survive component remounts. Key fix: subscriber skips `resolveRouteTo` when `previousUser.uid === firebaseUser.uid` — prevents Firestore stale-cache reads from overwriting an explicitly-set routeTo after consent is recorded.
- `ConsentModal` calls `setRouteTo('profile')` + `navigate('/profile')` after consent — Zustand ensures AuthGuard on `/profile` sees the correct value immediately.
- FT-6 error-state test: uses doc-deletion via emulator REST API (not network interception) because Firebase SDK resolves `updateDoc` optimistically via WebChannel — `NOT_FOUND` on a deleted doc is the only reliable way to trigger a Promise rejection.
- Back-button lock: `window.history.pushState` on ConsentModal mount + `popstate → navigate('/consent', { replace: true })`.

**Warnings / debt:**
- `ci.yml` not yet set up (Sprint 0 item); push to CI is a no-op until configured.
- Swipe-gesture dismissal is N/A for web (web has no swipe-to-dismiss built-in).
- Privacy Policy link (`href="#"`) is a placeholder — must be replaced with live URL before Play Store submission (Story #10).
- Branch: `feature/story-2-consent-web` pushed to https://github.com/joshimanoj/ckd

**Next:** Story #2 — run `/uat` for human visual sign-off. After UAT: merge to main, then `/prd` Story #3 (Child Profile Setup).

---

## Checkpoint: Story #3 Child Profile Setup | 2026-03-16 | /check PASSED

Story complete: AddChildScreen with name input + age-range pill selector; childProfileService writes to Firestore sub-collection `users/{uid}/childProfiles`; useChildProfile hook sets Zustand store + navigates to `/library` on success; error toast on failure. Returning users (profile exists) routed directly to `/library` by existing useAuth logic.

**Files changed:**
- `packages/shared/src/types/user.ts` — added `ChildProfile` interface + `isChildProfile` type guard
- `packages/shared/src/utils/ageRange.ts` — `dobFromAgeRange` utility (under-3→18mo, 3-4→42mo, 5-6→66mo)
- `packages/shared/src/firebase/collections.ts` — `childProfileConverter` + `childProfilesCollection(db, uid)`
- `apps/web/src/shared/store/childProfileStore.ts` — Zustand store (activeProfile, setActiveProfile, clearActiveProfile)
- `apps/web/src/features/childProfile/services/childProfileService.ts` — createChildProfile + getChildProfiles; `window.__TEST_FAIL_PROFILE_WRITE` test flag for FT-8
- `apps/web/src/features/childProfile/hooks/useChildProfile.ts` — saving/error state + saveProfile action
- `apps/web/src/features/childProfile/components/AddChildScreen.tsx` — pure presentational; data-testid attributes for E2E
- `apps/web/src/pages/ChildProfilePage.tsx` — thin connected wrapper (useAuth + useChildProfile → AddChildScreen)
- `apps/web/src/router.tsx` — `/profile` route wired to `<ChildProfilePage />`
- `apps/web/e2e/story-3/` — 8 Playwright E2E specs (FT-1 through FT-8, emulator-gated)

**Test results (CI):**
- Unit + integration: ✅ all passing
- web-playwright: ✅ passing (emulator-gated specs skipped in CI — require `FIREBASE_EMULATOR_RUNNING=1`)
- Type check: ✅ 0 errors | Lint: ✅ 0 errors

**Decisions made:**
- `AddChildScreen` is pure presentational (props-only) — no hooks/router mocks needed in unit tests; `ChildProfilePage` is the connected wrapper.
- `childProfileService` uses `_setDbForTesting(db)` injection for emulator integration tests.
- `window.__TEST_FAIL_PROFILE_WRITE` flag in service enables FT-8 (Firestore failure) without network interception.
- Branch history fix: Story 2 PR had merged into `origin/feature/story-1-auth-web` instead of `origin/main`. Fixed by merging Story 2 branch into local main and pushing, then rebasing feature-3 onto updated main.

**Warnings / debt:**
- All 8 Playwright E2E specs are gated behind `FIREBASE_EMULATOR_RUNNING=1` — never run in CI; require local emulator for full green.
- `window.__TEST_FAIL_PROFILE_WRITE` is a test-only global on `window` — acceptable for dev but must never reach production build (no tree-shaking guard currently).

**Next:** Story #3 — run `/uat` for human visual sign-off. After UAT: merge to main, then `/prd` Story #4 (Parental Gate).

---

## Checkpoint: Story #3 Child Profile Setup | 2026-03-16 | MERGED ✅

Story complete: Child profile setup screen shipped to main — name input + age-range pill selector writes to Firestore `users/{uid}/childProfiles`, sets Zustand store, navigates to `/library`.

UAT fixes applied: Header copy changed from "Who's watching?" to "Add your child's profile" + subtitle "We'll personalise the experience for them" to match prototype; unit test updated to match.

Next: Story #4 Parental Gate | Ready for: /prd

---

## Checkpoint: Story #4 Parental Gate | 2026-03-17 | MERGED ✅

Story complete: Parental gate shipped to main — math challenge modal (`ParentalGate` component + `useParentalGate` hook) wired into `LibraryPage`; correct answer reveals parent panel, wrong answer shakes + regenerates question, X dismisses without granting access.

UAT fixes applied: none.

Infrastructure shipped alongside: Firebase emulator wired into `web-playwright` CI job — all future E2E tests with `FIREBASE_EMULATOR_RUNNING` guard now run automatically in CI from Story 5 onwards.

Next: Story #5 Video Library Grid | Ready for: /prd
