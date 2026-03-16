# Story #1: Google Sign-In & Authentication | Pass 1 — Web | Type: UI

Generated: 2026-03-16 | Spec: prd-1-web.md | UI Context: story-1-ui-context.md | UAT: story-1-uat.md

---

## Track B — Functional Tests (write first, start RED)

- [ ] FT-1: Sign In screen renders correctly — `apps/web/e2e/story-1/sign-in-renders.spec.ts` — 6 min
- [ ] FT-2: Google Sign-In popup flow + Firestore user doc created — `apps/web/e2e/story-1/sign-in-flow.spec.ts` — 10 min
- [ ] FT-3: First-time user routed to Consent Modal — `apps/web/e2e/story-1/routing-first-time.spec.ts` — 6 min
- [ ] FT-4: Returning authenticated user bypasses Sign In + routed correctly — `apps/web/e2e/story-1/routing-returning-user.spec.ts` — 8 min
- [ ] FT-5: Sign-out clears session and returns to Sign In — `apps/web/e2e/story-1/sign-out.spec.ts` — 5 min
- [ ] FT-6: Responsive rendering at 375px, 480px, 768px — `apps/web/e2e/story-1/responsive.spec.ts` — 7 min
- [ ] FT-7: Error states (network failure, cancel, offline) — `apps/web/e2e/story-1/error-states.spec.ts` — 10 min

---

## Track A — Implementation Tasks

- [x] Task 1: Shared User type + Firebase collection references — `packages/shared/src/types/user.ts`, `collections.ts` — 7 min
- [x] Task 2: Firebase app initialisation (shared config + emulator connect) — `packages/shared/src/firebase/config.ts` — 6 min
- [x] Task 3: Zustand authStore — `apps/web/src/shared/store/authStore.ts` — 5 min
- [x] Task 4: authService (signInWithGoogle, signOutUser, createUserDoc, getUserDoc, subscribeToAuthState) — `apps/web/src/features/auth/services/authService.ts` — 10 min
- [x] Task 5: useAuth hook (auth state listener + routing logic) — `apps/web/src/features/auth/hooks/useAuth.ts` — 10 min
- [x] Task 6: GoogleSignInButton component (idle / loading / error states) — `apps/web/src/features/auth/components/GoogleSignInButton.tsx` — 8 min
- [x] Task 7: OnboardingPage (Sign In screen layout + offline state) — `apps/web/src/pages/OnboardingPage.tsx` — 10 min
- [x] Task 8: React Router setup + AuthGuard + App root — `apps/web/src/router.tsx`, `apps/web/src/App.tsx` — 8 min

---

## Integration Check

- [ ] `vitest run` — all unit + integration tests passing
- [ ] `npx playwright test e2e/story-1/` — all 7 FT tasks GREEN
- [ ] `tsc --noEmit` — zero type errors
- [ ] `eslint .` — zero lint errors
- [ ] Firestore user doc fields match architecture.md §3 exactly (no extras)
- [ ] No Firebase Analytics SDK in any file touched by this story

## Story Acceptance

- [ ] Ready for /check
