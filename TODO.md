# Story #2: DPDP Parental Consent Flow | Pass 1 — Web | Type: UI

Generated: 2026-03-16 | Spec: prd-2-web.md | UI Context: story-2-ui-context.md | UAT: story-2-uat.md

---

## Track B — Functional Tests (write first, start RED)

- [ ] FT-1: ConsentModal renders for user with consentGiven:false — `apps/web/e2e/story-2/consent-renders.spec.ts` — 8 min
- [ ] FT-2: Modal is non-dismissable (backdrop, Escape, back button) — `apps/web/e2e/story-2/consent-non-dismissable.spec.ts` — 8 min
- [ ] FT-3: Checkbox unchecked by default; button disabled until checked — `apps/web/e2e/story-2/consent-checkbox-gating.spec.ts` — 6 min
- [ ] FT-4: On confirm — Firestore consentGiven:true + consentTimestamp written — `apps/web/e2e/story-2/consent-firestore-write.spec.ts` — 8 min
- [ ] FT-5: On confirm — navigates to /profile — `apps/web/e2e/story-2/consent-navigation.spec.ts` — 5 min
- [ ] FT-6: Firestore write failure — error toast shown, modal stays open — `apps/web/e2e/story-2/consent-error-state.spec.ts` — 8 min
- [ ] FT-7: User with consentGiven:true bypasses /consent — `apps/web/e2e/story-2/consent-already-given.spec.ts` — 5 min

---

## Track A — Implementation Tasks

- [x] Task 1: Add `recordConsent()` to authService.ts + unit test — `apps/web/src/features/auth/services/authService.ts` — 8 min
- [x] Task 2: ConsentModal component — structure + all content — `apps/web/src/features/auth/components/ConsentModal.tsx` — 10 min
- [x] Task 3: Checkbox state + button gating — `apps/web/src/features/auth/components/ConsentModal.tsx` — 8 min
- [x] Task 4: Submit handler — recordConsent() + error toast + navigation — `apps/web/src/features/auth/components/ConsentModal.tsx` — 10 min
- [x] Task 5: Router wiring + non-dismissable behaviour + responsive CSS — `apps/web/src/router.tsx` — 8 min

---

## Integration Check

- [x] Full unit test suite passing (`vitest run`)
- [x] All FT tasks GREEN (`FIREBASE_EMULATOR_RUNNING=1 npx playwright test apps/web/e2e/story-2/`)
- [ ] All acceptance criteria verified against story-2.md

## Story Acceptance

- [ ] Ready for /check
