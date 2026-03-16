# Story #3: Child Profile Setup | Pass 1 — Web | Type: UI

Generated: 2026-03-16 | Branch: feature/story-3-child-profile-web
Spec: task_spec_document.md | UI Context: story-3-ui-context.md | UAT: story-3-uat.md

---

## Track B — Functional Tests (write first, start RED)

- [x] FT-1: Screen renders at `/profile` when `consentGiven: true` + no profiles — `apps/web/e2e/story-3/profile-screen-renders.spec.ts` — 8 min
- [x] FT-2: Name whitespace-only = empty → button disabled — `apps/web/e2e/story-3/name-validation.spec.ts` — 6 min
- [x] FT-3: Age range selector — 3 pills, single-select mutual exclusion — `apps/web/e2e/story-3/age-range-selector.spec.ts` — 6 min
- [x] FT-4: CTA disabled until name + age both filled — `apps/web/e2e/story-3/cta-disabled-state.spec.ts` — 6 min
- [x] FT-5: Firestore document written with correct fields on confirm — `apps/web/e2e/story-3/firestore-write.spec.ts` — 8 min
- [x] FT-6: `childProfileStore` set + navigate to `/library` after creation — `apps/web/e2e/story-3/post-creation-navigation.spec.ts` — 7 min
- [x] FT-7: Returning user (profile exists) routes to `/library`, not `/profile` — `apps/web/e2e/story-3/returning-user-routing.spec.ts` — 6 min
- [x] FT-8: Firestore write failure → error toast, no navigation — `apps/web/e2e/story-3/firestore-write-failure.spec.ts` — 7 min

---

## Track A — Implementation Tasks

- [x] Task 1: `ChildProfile` interface + type guard — `packages/shared/src/types/user.ts` — 5 min
- [x] Task 2: `dobFromAgeRange` utility — `packages/shared/src/utils/ageRange.ts` — 7 min
- [x] Task 3: `childProfilesCollection` Firestore ref — `packages/shared/src/firebase/collections.ts` — 5 min
- [x] Task 4: `childProfileStore` Zustand store — `apps/web/src/shared/store/childProfileStore.ts` — 6 min
- [x] Task 5: `childProfileService` (create + get) — `apps/web/src/features/childProfile/services/childProfileService.ts` — 8 min
- [x] Task 6: `useChildProfile` hook — `apps/web/src/features/childProfile/hooks/useChildProfile.ts` — 8 min
- [x] Task 7: `AddChildScreen` component — `apps/web/src/features/childProfile/components/AddChildScreen.tsx` — 10 min
- [x] Task 8: Wire into router (`ChildProfilePage`) — `apps/web/src/router.tsx`, `apps/web/src/pages/ChildProfilePage.tsx` — 7 min

---

## Integration Check

- [x] `vitest run` — 25 unit tests passing, 4 emulator skipped
- [x] `tsc --noEmit` — zero type errors
- [x] `eslint .` — zero lint errors
- [ ] `npx playwright test e2e/story-3/` — all 8 FT tasks GREEN (requires Firebase emulator)
- [ ] Firestore doc contains only `name`, `dateOfBirth`, `createdAt` — no extra fields (DPDP compliance)
- [ ] No Firebase Analytics SDK in any new file

## Story Acceptance

- [ ] Ready for /check
