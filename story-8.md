# Story 8: Watch Time Dashboard

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 3 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent
I want to see how long my child watched today, this week, and this month
So that I can make informed, guilt-free decisions about screen time

---

### Context

The Dashboard is the primary parent-value feature — the thing that differentiates this app from "just watching YouTube". It surfaces the watch session data written by Story 7 into a clear, readable summary. The parent sees a prominent today total, a weekly bar chart, and a monthly total. No per-video breakdown in V1 (V1.1 feature). The Dashboard is accessed via the Parent Panel (after passing the Parental Gate, Story 4) and has no edit or control functionality — it is read-only.

---

### Problem Statement

**Current State:** Parents have no visibility into how long their child watched. YouTube provides no per-child, per-session data to the viewer.

**Pain Points:**
- Guilt and anxiety about screen time with no data to validate or refute concern
- No way to know if the child watched for 5 minutes or 2 hours
- Third-party parental control apps are complex and expensive

**Desired State:** Parent opens the app, taps the parent icon, passes the gate, and sees today's watch time in large readable numbers — "1 hr 20 min" — plus a bar chart for the week and a monthly total below. Empty state is warm and informative, not punitive.

---

### User Flow

**Trigger:** Parent taps parent icon → passes Parental Gate → Parent Panel bottom sheet slides up → Dashboard tab is shown.

**Steps:**
1. `useDashboard` hook fires Firestore queries for today, this week, this month
2. While loading: shimmer skeleton bars (same shape as real chart)
3. On success:
   - Today's total: large display — "X hr Y min" (or "Y min" if < 1 hour) — Baloo 2 ExtraBold 28sp, brand purple `#9333EA`
   - Weekly bar chart: 7 bars (Mon–Sun), height proportional to `watchedSeconds` for each day; today's bar highlighted in brand purple, others in light purple `#C4B5FD`
   - Monthly total: "This month: X hr Y min" — Nunito SemiBold 600 15sp
4. Data is aggregated client-side: sum `watchedSeconds` from watch sessions in date range
5. Parent reads data, swipes down or taps outside bottom sheet to dismiss → returns to Library

**Date range queries:**
- Today: `startTime >= startOfToday()` (00:00 device local time)
- This week: `startTime >= startOfWeek()` (Monday 00:00)
- This month: `startTime >= startOfMonth()` (1st of month 00:00)

**Empty state (no sessions):**
- Warm illustrated empty state: creator avatar + "No watch time recorded yet. Start a video to begin tracking." (Nunito Regular 15sp, `#6B7280`)

**Alternatives / Error States:**
- Firestore query fails → toast error "Couldn't load data. Try again." with retry button inside panel
- All sessions in a period are 0 seconds (e.g. video opened and immediately closed) → show 0 min (not empty state)

---

### Acceptance Criteria

**Functional:**
- [ ] Dashboard accessible only after passing Parental Gate (Story 4)
- [ ] Today's total displayed in "X hr Y min" format (or "Y min" if < 60 seconds)
- [ ] Weekly bar chart shows 7 days (Mon–Sun), correct heights from session data
- [ ] Monthly total displayed below chart
- [ ] All aggregation done client-side (sum of `watchedSeconds` from Firestore results)
- [ ] Queries use `startOfToday()`, `startOfWeek()`, `startOfMonth()` from shared utils
- [ ] Empty state shown when no sessions exist for the active child profile
- [ ] Shimmer skeleton shown while data loads

**Non-Functional:**
- [ ] Dashboard query resolves in < 1 second for < 100 sessions (client-side aggregation, small dataset)
- [ ] Time formatted correctly: "0 hr 45 min" → "45 min"; "1 hr 0 min" → "1 hr"; "2 hr 15 min" → "2 hr 15 min"
- [ ] Weekly chart bars have minimum 4dp height even for 0-second days (to show the bar exists)
- [ ] Bottom sheet swipe-down gesture works to dismiss panel
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] Child profile has zero sessions → empty state (not "0 min" today)
- [ ] Timezone edge case: `startOfToday()` uses device local time, not UTC
- [ ] Session spans midnight (started yesterday, ended today) → `startTime` determines which day it counts for
- [ ] Multiple sessions same day → all `watchedSeconds` summed correctly

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 3 (IA — Parent Panel / Dashboard), 4 (Flow 3), 7 (Interaction Patterns — Loading states, Empty states)

**Key UI Elements:**
- Parent Panel: bottom sheet, 24dp top border-radius, `#FAFAFA` background, drag handle at top
- Today label: "Today" — Nunito SemiBold 13sp, `#6B7280`
- Today value: "X hr Y min" — Baloo 2 ExtraBold 28sp, `#9333EA`
- Bar chart: custom component (no third-party chart lib required for 7 simple bars)
  - Bar container: 8dp wide, 120dp max height, `#E9D5FF` track background
  - Filled bar: `#9333EA` for today, `#C4B5FD` for other days
  - Day labels below bars: "M T W T F S S" — 11sp Nunito, `#6B7280`
- Monthly total: Nunito SemiBold 15sp, `#1E1B4B`
- Shimmer: same shape as content, animating grey shimmer left-to-right
- Empty state: creator avatar (60dp) + copy — centred, `#6B7280` text

**Visual Requirements:**
- Dashboard must feel like a calm, informative tool — not a gamified score
- No green/red colouring implying "good" or "bad" watch time — neutral purple palette throughout
- No "You're doing great!" or guilt-inducing copy — present data, no judgement

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/dashboard/components/DashboardScreen.tsx` (new)
- `apps/mobile/src/features/dashboard/components/WatchTimeChart.tsx` (new — custom 7-bar chart)
- `apps/mobile/src/features/dashboard/hooks/useDashboard.ts` (new)
- `apps/mobile/src/features/dashboard/services/dashboardService.ts` (new)
- `apps/mobile/src/shared/navigation/RootNavigator.tsx` (Parent Panel bottom sheet with Dashboard + Settings tabs)
- `apps/web/src/features/dashboard/` (mirrors mobile)
- `packages/shared/src/utils/watchTime.ts` (`formatSeconds()` — converts seconds to "X hr Y min")
- `packages/shared/src/utils/dateRanges.ts` (`startOfToday()`, `startOfWeek()`, `startOfMonth()`)

**Dependencies:**
- Story 4 (Parental Gate) must be complete — Dashboard is gated
- Story 7 (Watch Session Tracking) must be complete — Dashboard reads from `watchSessions`
- `childProfileStore` must expose active `childProfileId` for query scoping

**API Contracts (Firebase):**
```ts
// Today
getDocs(query(
  collection(db, 'users', uid, 'childProfiles', childProfileId, 'watchSessions'),
  where('startTime', '>=', startOfToday()),
  orderBy('startTime')
))

// This week
getDocs(query(..., where('startTime', '>=', startOfWeek()), orderBy('startTime')))

// This month
getDocs(query(..., where('startTime', '>=', startOfMonth()), orderBy('startTime')))

// Aggregation (client-side)
const totalSeconds = sessions.reduce((sum, s) => sum + s.watchedSeconds, 0)
```

**Firestore indexes required:**
- `startTime DESC` on `watchSessions` — already defined in architecture.md

---

### Complexity & Effort

**Score:** 3 (2–3 days)
**Estimated Tasks:** ~9 atomic tasks
**Risk Factors:**
- Custom bar chart component: keep simple (no SVG library, just View/height calculations in React Native)
- `startOfWeek()` must use Monday as week start (standard in India) — verify utility function
- Three parallel Firestore queries (today/week/month) — run concurrently with `Promise.all`
- Bottom sheet implementation: use `react-native` `Modal` with animation, or `@gorhom/bottom-sheet` (check Expo managed workflow compatibility)

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- `packages/shared/src/utils/dateRanges.ts` — `startOfToday()`, `startOfWeek()`, `startOfMonth()`
- `packages/shared/src/utils/watchTime.ts` — `formatSeconds()` (already written in Story 7)
- `apps/*/src/features/dashboard/hooks/useDashboard.ts`
- `apps/*/src/features/dashboard/services/dashboardService.ts`

**[WEB] — Pass 1 only:**
- `apps/web/src/features/dashboard/components/DashboardScreen.tsx` (HTML/CSS)
- `apps/web/src/features/dashboard/components/WatchTimeChart.tsx` (CSS bars / SVG)
- Integrated into side drawer Parent Panel (web)
- `apps/web/src/pages/DashboardPage.tsx`

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/dashboard/components/DashboardScreen.tsx` (RN View)
- `apps/mobile/src/features/dashboard/components/WatchTimeChart.tsx` (RN View height-based bars)
- Integrated into bottom sheet Parent Panel (mobile)

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-8-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-8-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-8-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-8-native.md` → `completed/`
- [ ] Both passes complete → `story-8.md` → `completed/`
