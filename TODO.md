# Story #4: Parental Gate | Type: UI | Pass: Web

---

## Track B — Functional Tests (write first, start RED)

- [ ] FT-1: Parent icon visible on library screen — `apps/web/e2e/story-4/parental-gate.spec.ts` — 5 min
- [ ] FT-2: Tapping parent icon opens gate modal with math question — `apps/web/e2e/story-4/parental-gate.spec.ts` — 6 min
- [ ] FT-3: Confirm button disabled when answer field is empty — `apps/web/e2e/story-4/parental-gate.spec.ts` — 5 min
- [ ] FT-4: Wrong answer clears input, new question generated, modal stays open — `apps/web/e2e/story-4/parental-gate.spec.ts` — 7 min
- [ ] FT-5: Correct answer closes modal and reveals parent panel — `apps/web/e2e/story-4/parental-gate.spec.ts` — 7 min
- [ ] FT-6: X button closes modal, parent panel not shown — `apps/web/e2e/story-4/parental-gate.spec.ts` — 5 min

---

## Track A — Implementation Tasks

- [x] Task 1: `generateGateQuestion()` shared utility + unit tests — `packages/shared/src/utils/parentalGate.ts` — 8 min
- [x] Task 2: `useParentalGate` hook + unit tests — `apps/web/src/shared/hooks/useParentalGate.ts` — 10 min
- [x] Task 3: `ParentalGate` component base UI — `apps/web/src/features/parentalGate/components/ParentalGate.tsx` — 10 min
- [x] Task 4: Shake animation + wrong-answer state in `ParentalGate` — extend Task 3 files — 7 min
- [ ] Task 5: `LibraryPage` stub + gate wiring — `apps/web/src/pages/LibraryPage.tsx` — 10 min
- [ ] Task 6: Router update — wire `LibraryPage` at `/library` — `apps/web/src/router.tsx` — 5 min

---

## Integration Check

- [ ] `vitest run` — zero failures
- [ ] `FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-4/` — all 6 FTs GREEN
- [ ] `tsc --noEmit` — zero errors
- [ ] `eslint .` — zero errors
- [ ] All 7 acceptance criteria groups verified against story-4.md

## Story Acceptance

- [ ] Ready for /check
