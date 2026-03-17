# Story #8: Watch Time Dashboard | Type: UI | Pass: 1 — Web

Branch: feature/story-8-watch-time-dashboard-web

---

## Track B — Functional Tests (write first, start RED)

- [ ] FT-1: Dashboard gated by Parental Gate — `apps/web/e2e/story-8/gate-blocks-dashboard.spec.ts` — 8 min
- [ ] FT-2: Happy path — today total + chart + monthly total — `apps/web/e2e/story-8/dashboard-happy-path.spec.ts` — 9 min
- [ ] FT-3: Empty state (no sessions) — `apps/web/e2e/story-8/dashboard-empty-state.spec.ts` — 7 min
- [ ] FT-4: Shimmer during load (unit) — `apps/web/src/features/dashboard/components/__tests__/DashboardScreen.test.tsx` — 6 min
- [ ] FT-5: Error state + retry (unit) — `apps/web/src/features/dashboard/components/__tests__/DashboardScreen.test.tsx` — 5 min
- [ ] FT-6: Chart bar highlighting + proportional heights (unit) — `apps/web/src/features/dashboard/components/__tests__/WatchTimeChart.test.tsx` — 6 min
- [ ] FT-7: Parent panel open/close — `apps/web/e2e/story-8/parent-panel-open-close.spec.ts` — 7 min

---

## Track A — Implementation Tasks

- [ ] Task 1: dateRanges.ts — startOfToday / startOfWeek / startOfMonth — `packages/shared/src/utils/dateRanges.ts` — 8 min
- [ ] Task 2: Fix formatSeconds — "1 hr 0 min" → "1 hr" edge case — `packages/shared/src/utils/watchTime.ts` — 5 min
- [ ] Task 3: E2E seed helpers — seedChildProfileWithId + seedWatchSession — `apps/web/e2e/support/emulator.ts` — 7 min
- [ ] Task 4: dashboardService.ts — fetchSessionsSince Firestore query — `apps/web/src/features/dashboard/services/dashboardService.ts` — 8 min
- [ ] Task 5: useDashboard hook — Promise.all + aggregation — `apps/web/src/features/dashboard/hooks/useDashboard.ts` — 9 min
- [ ] Task 6: WatchTimeChart component — 7-bar CSS chart — `apps/web/src/features/dashboard/components/WatchTimeChart.tsx` — 8 min
- [ ] Task 7: DashboardScreen component — shimmer + empty + error + data states — `apps/web/src/features/dashboard/components/DashboardScreen.tsx` — 10 min
- [ ] Task 8: ParentPanel side drawer — slide-in drawer for web — `apps/web/src/features/dashboard/components/ParentPanel.tsx` — 8 min
- [ ] Task 9: Wire ParentPanel into LibraryPage — replace stub — `apps/web/src/pages/LibraryPage.tsx` — 6 min

---

## Integration Check

- [ ] Full unit test suite passing (`npm run test:unit` in `apps/web`)
- [ ] All FT tasks GREEN (Playwright: `FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-8/`)
- [ ] All acceptance criteria in story-8.md verified
- [ ] Responsive: renders at 480–768px, no horizontal scroll at < 480px

## Story Acceptance

- [ ] Ready for /check
