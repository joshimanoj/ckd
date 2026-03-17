# Story #8: Watch Time Dashboard | Type: UI | Pass: 1 — Web

Branch: feature/story-8-watch-time-dashboard-web

---

## Track B — Functional Tests

- [x] FT-1: Dashboard gated by Parental Gate — `apps/web/e2e/story-8/gate-blocks-dashboard.spec.ts`
- [x] FT-2: Happy path — today total + chart + monthly total — `apps/web/e2e/story-8/dashboard-happy-path.spec.ts`
- [x] FT-3: Empty state (no sessions) — `apps/web/e2e/story-8/dashboard-empty-state.spec.ts`
- [x] FT-4: Shimmer during load (unit) — GREEN ✅ `DashboardScreen.test.tsx`
- [x] FT-5: Error state + retry (unit) — GREEN ✅ `DashboardScreen.test.tsx`
- [x] FT-6: Chart bar highlighting + proportional heights (unit) — GREEN ✅ `WatchTimeChart.test.tsx`
- [x] FT-7: Parent panel open/close — `apps/web/e2e/story-8/parent-panel-open-close.spec.ts`

---

## Track A — Implementation Tasks

- [x] Task 1: dateRanges.ts — startOfToday / startOfWeek / startOfMonth
- [x] Task 2: Fix formatSeconds — "1 hr 0 min" → "1 hr" edge case
- [x] Task 3: E2E seed helpers — seedChildProfileWithId + seedWatchSession
- [x] Task 4: dashboardService.ts — fetchSessionsSince Firestore query
- [x] Task 5: useDashboard hook — Promise.all + aggregation
- [x] Task 6: WatchTimeChart component — 7-bar CSS chart
- [x] Task 7: DashboardScreen component — shimmer + empty + error + data states
- [x] Task 8: ParentPanel side drawer — slide-in drawer for web
- [x] Task 9: Wire ParentPanel into LibraryPage — replace stub

---

## Integration Check

- [x] Full unit test suite passing (189 pass, 1 pre-existing failure in useAuth.test.ts)
- [ ] All FT tasks GREEN (Playwright: `FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-8/`)
- [ ] All acceptance criteria in story-8.md verified
- [ ] Responsive: renders at 480–768px, no horizontal scroll at < 480px

## Story Acceptance

- [ ] Ready for /check
