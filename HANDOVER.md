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
