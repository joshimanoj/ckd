# PRD: Story #8 — Watch Time Dashboard | Pass 1 — Web

Generated: 2026-03-17 | Branch: feature/story-8-watch-time-dashboard-web
Tech stack: React 18 + Vite + TypeScript | Vitest (unit) | Playwright (E2E)

---

## Track B — Functional Tests (write first, start RED)

### Functional Test FT-1: Dashboard accessible only after Parental Gate

Criterion (from story-8.md): Dashboard accessible only after passing Parental Gate (Story 4)
Test File: `apps/web/e2e/story-8/gate-blocks-dashboard.spec.ts`
Framework: Playwright

User Flow:
1. Sign in, seed user doc + child profile
2. Navigate to /library
3. Confirm parent-panel is NOT visible without solving gate
4. Tap parent icon — gate appears
5. Dismiss gate without solving — panel stays hidden
6. Tap parent icon again — solve gate correctly
7. Assert parent-panel is now visible with dashboard content

Assertions:
- `[data-testid="parent-panel"]` not visible before gate solved
- `[data-testid="parent-gate-modal"]` appears on parent icon tap
- After correct answer: `[data-testid="parent-panel"]` visible
- `[data-testid="dashboard-screen"]` inside the panel

Initial Status: RED

---

### Functional Test FT-2: Happy path — today total, weekly chart, monthly total rendered

Criterion (from story-8.md): Today's total displayed; weekly bar chart shows 7 days; monthly total displayed below chart
Test File: `apps/web/e2e/story-8/dashboard-happy-path.spec.ts`
Framework: Playwright

User Flow:
1. Seed child profile with known ID
2. Seed watch sessions: 2700s today (45 min), 1800s yesterday, 3600s same-week day
3. Sign in, navigate to /library, solve parental gate
4. Assert today value shows "45 min"
5. Assert 7 day bars visible (`[data-testid="chart-bar"]` × 7)
6. Assert monthly total text contains the aggregated value

Assertions:
- `[data-testid="today-value"]` text === "45 min"
- `querySelectorAll('[data-testid="chart-bar"]').length === 7`
- `[data-testid="monthly-total"]` visible and non-empty
- No empty state visible

Initial Status: RED

---

### Functional Test FT-3: Empty state shown when child has no sessions

Criterion (from story-8.md): Empty state shown when no sessions exist for the active child profile
Test File: `apps/web/e2e/story-8/dashboard-empty-state.spec.ts`
Framework: Playwright

User Flow:
1. Seed user doc + child profile — NO watch sessions
2. Sign in, navigate to /library, solve gate
3. Assert empty state visible
4. Assert dashboard data elements NOT visible

Assertions:
- `[data-testid="dashboard-empty-state"]` visible
- `[data-testid="today-value"]` not visible (or hidden)
- `[data-testid="watch-time-chart"]` not visible

Initial Status: RED

---

### Functional Test FT-4: Shimmer skeleton visible while data loads (Unit — Vitest)

Criterion (from story-8.md): Shimmer skeleton shown while data loads
Test File: `apps/web/src/features/dashboard/components/__tests__/DashboardScreen.test.tsx`
Framework: Vitest + @testing-library/react

User Flow:
1. Render `<DashboardScreen />` with mocked `useDashboard` returning `{ loading: true }`
2. Assert shimmer skeleton elements present
3. Assert today-value NOT rendered while loading

Assertions:
- `getByTestId('dashboard-shimmer')` present
- `queryByTestId('today-value')` is null

Initial Status: RED

---

### Functional Test FT-5: Error state with retry button (Unit — Vitest)

Criterion (from story-8.md): Firestore query fails → toast error with retry button
Test File: `apps/web/src/features/dashboard/components/__tests__/DashboardScreen.test.tsx`
Framework: Vitest + @testing-library/react

User Flow:
1. Render `<DashboardScreen />` with mocked `useDashboard` returning `{ error: new Error('fail'), loading: false }`
2. Assert error message visible
3. Assert retry button present
4. Click retry → assert refetch called

Assertions:
- `getByTestId('dashboard-error')` present
- `getByTestId('retry-btn')` present
- After retry click: refetch mock called once

Initial Status: RED

---

### Functional Test FT-6: Weekly chart — today's bar highlighted, bar heights proportional

Criterion (from story-8.md): Weekly bar chart shows 7 days (Mon–Sun), correct heights from session data; today's bar highlighted in brand purple
Test File: `apps/web/src/features/dashboard/components/__tests__/WatchTimeChart.test.tsx`
Framework: Vitest + @testing-library/react

User Flow:
1. Render `<WatchTimeChart weekDayTotals={[0, 0, 3600, 0, 1800, 0, 0]} todayDayIndex={2} />`
2. Assert 7 bars rendered
3. Assert bar at index 2 has today highlight colour (#9333EA via data-attr or inline style)
4. Assert bar at index 2 has greater height than bar at index 4 (3600s > 1800s)
5. Assert bars at index 0, 1, 3, 5, 6 have non-zero min height (≥ 4px for 0-second days)

Assertions:
- 7 `[data-testid="chart-bar"]` elements
- Bar index 2 `data-today="true"` or inline background `#9333EA`
- Bar index 2 `clientHeight` > bar index 4 `clientHeight` (or inline height style ratio correct)
- All bars have `min-height` of ≥ 4px even when 0 seconds

Initial Status: RED

---

### Functional Test FT-7: Parent panel side drawer opens and closes

Criterion (from story-8.md): Bottom sheet swipe-down dismisses panel [web: side drawer click-outside or close button]
Test File: `apps/web/e2e/story-8/parent-panel-open-close.spec.ts`
Framework: Playwright

User Flow:
1. Sign in, navigate to /library, solve gate
2. Assert `[data-testid="parent-panel"]` visible
3. Click close button (`[data-testid="panel-close-btn"]`)
4. Assert panel no longer visible
5. Tap parent icon again → solve gate → assert panel reopens

Assertions:
- Panel visible after gate pass
- Panel hidden after close button click
- Panel reopens correctly after solving gate again

Initial Status: RED

---

## Track A — Implementation Tasks

### Task 1 of 9: Date Range Utilities

Type: Feature

Files:
  Test: `packages/shared/src/utils/__tests__/dateRanges.test.ts`
  Implementation: `packages/shared/src/utils/dateRanges.ts`

What to Build:
  Add: `startOfToday(): Date`, `startOfWeek(): Date`, `startOfMonth(): Date`
  Behavior:
    - `startOfToday()` → today at 00:00:00.000 in device local time
    - `startOfWeek()` → most recent Monday at 00:00:00.000 (Indian convention — Mon is first day)
    - `startOfMonth()` → 1st of current month at 00:00:00.000
  Edge cases:
    - startOfWeek on Monday → returns today 00:00
    - startOfWeek on Sunday → returns 6 days ago (the Monday)
    - startOfMonth on 1st → returns today 00:00

Test Requirements:
  Input: fixed Date via jest.setSystemTime / vi.setSystemTime
  Expected output: Date objects with correct year/month/day/time
  Test description:
    - "should return today at midnight in local time"
    - "should return Monday of current week at midnight"
    - "should return 1st of current month at midnight"
    - "startOfWeek: when today is Sunday, returns the previous Monday"
    - "startOfWeek: when today is Monday, returns today"

Implementation Notes:
  - Use `new Date()` and setHours(0,0,0,0) — no date library needed
  - For startOfWeek: `getDay()` returns 0=Sun, 1=Mon…6=Sat. Monday offset = `(day + 6) % 7`
  - Export from `packages/shared/src/utils/index.ts` if that barrel exists

---

### Task 2 of 9: Fix formatSeconds Edge Case

Type: Bug Fix

Files:
  Test: `packages/shared/src/utils/__tests__/watchTime.test.ts`
  Implementation: `packages/shared/src/utils/watchTime.ts`

What to Build:
  Modify: `formatSeconds(totalSeconds: number): string`
  Behavior fix: when hours > 0 and minutes === 0, return "${hours} hr" (not "${hours} hr 0 min")
  Full spec:
    - < 60s → "< 1 min"
    - 60–3599s → "${minutes} min"
    - 3600s exactly → "1 hr"
    - 3601–7199s → "1 hr ${minutes} min"
    - ≥ 7200s, minutes === 0 → "${hours} hr"
    - ≥ 7200s, minutes > 0 → "${hours} hr ${minutes} min"

Test Requirements:
  Input/Expected:
    - formatSeconds(0) → "< 1 min"
    - formatSeconds(59) → "< 1 min"
    - formatSeconds(60) → "1 min"
    - formatSeconds(2700) → "45 min"
    - formatSeconds(3600) → "1 hr"
    - formatSeconds(3660) → "1 hr 1 min"
    - formatSeconds(5400) → "1 hr 30 min"
    - formatSeconds(7200) → "2 hr"
    - formatSeconds(8100) → "2 hr 15 min"

Implementation Notes:
  - Existing function is at `packages/shared/src/utils/watchTime.ts`
  - Change: `if (hours > 0) return \`${hours} hr ${minutes} min\`` → add minutes guard:
    `if (hours > 0 && minutes > 0) return \`${hours} hr ${minutes} min\``
    `if (hours > 0) return \`${hours} hr\``

---

### Task 3 of 9: E2E Seed Helpers — seedChildProfileWithId + seedWatchSession

Type: Feature (test infrastructure)

Files:
  Test: none (this IS the test infrastructure)
  Implementation: `apps/web/e2e/support/emulator.ts` (modify)

What to Build:
  Add:
    ```ts
    seedChildProfileWithId(request, uid, childProfileId, name?)
    // Creates child profile document at known path using PATCH (avoids auto-ID)

    interface SeedWatchSessionInput {
      sessionId: string
      youtubeVideoId?: string
      videoDurationSeconds?: number
      watchedSeconds: number
      startTime: string  // ISO string
      deviceType?: 'web' | 'android'
    }

    seedWatchSession(request, uid, childProfileId, session: SeedWatchSessionInput)
    // Creates watchSession under users/{uid}/childProfiles/{childProfileId}/watchSessions/{sessionId}
    ```

Edge cases:
  - seedChildProfileWithId must use PATCH (not POST) to preserve the known ID
  - seedWatchSession startTime stored as Firestore timestampValue

Test Requirements:
  Verify in FT-2 and FT-3 that seeded data appears correctly in the app.

Implementation Notes:
  - `packages/shared/src/utils/watchTime.ts` - Firestore REST path:
    `users/{uid}/childProfiles/{childProfileId}/watchSessions/{sessionId}`
  - Firestore PATCH endpoint:
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/childProfiles/${childProfileId}`
  - For watchSessions:
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/childProfiles/${childProfileId}/watchSessions/${sessionId}`
  - startTime field: `{ timestampValue: isoString }`
  - watchedSeconds field: `{ integerValue: String(watchedSeconds) }`
  - childProfileStore must also be populated — store uses the first childProfile loaded from Firestore after sign-in. Seed the profile at a known ID so queries work.
  - Also add: `getChildProfileId(request, uid): Promise<string>` to retrieve the auto-generated ID for use in seeding watch sessions when using the existing `seedChildProfile`

---

### Task 4 of 9: dashboardService.ts — Firestore Query Function

Type: Feature

Files:
  Test: `apps/web/src/features/dashboard/__tests__/dashboardService.test.ts`
  Implementation: `apps/web/src/features/dashboard/services/dashboardService.ts`

What to Build:
  Add:
    ```ts
    fetchSessionsSince(
      db: Firestore,
      uid: string,
      childProfileId: string,
      since: Date
    ): Promise<WatchSession[]>
    ```
  Behavior: Queries `watchSessions` collection filtered by `startTime >= since`, ordered by `startTime ASC`. Returns array of `WatchSession` typed documents.

Edge cases:
  - Returns `[]` when no sessions match (not null)
  - Firestore error propagates as thrown Error

Test Requirements:
  - Mock Firestore (vi.mock firebase/firestore) or use vi.fn stubs
  - Input: mock returning 2 docs with watchedSeconds 1800, 900
  - Expected: array of 2 WatchSession objects with correct fields
  - "should return empty array when no sessions exist"
  - "should propagate Firestore errors"

Implementation Notes:
  - WatchSession type is in `packages/shared/src/types` — import from there
  - Use `collection`, `query`, `where`, `orderBy`, `getDocs` from `firebase/firestore`
  - Path: `collection(db, 'users', uid, 'childProfiles', childProfileId, 'watchSessions')`
  - where: `where('startTime', '>=', Timestamp.fromDate(since))`
  - orderBy: `orderBy('startTime', 'asc')`

---

### Task 5 of 9: useDashboard Hook

Type: Feature

Files:
  Test: `apps/web/src/features/dashboard/__tests__/useDashboard.test.ts`
  Implementation: `apps/web/src/features/dashboard/hooks/useDashboard.ts`

What to Build:
  ```ts
  interface DashboardData {
    todaySeconds: number
    weekDayTotals: number[]  // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] — 7 values
    monthSeconds: number
    loading: boolean
    error: Error | null
    refetch: () => void
  }

  useDashboard(db: Firestore, uid: string, childProfileId: string): DashboardData
  ```
  Behavior:
    - On mount: runs 3 `fetchSessionsSince` calls concurrently via `Promise.all`
    - Aggregates today total: sum all watchedSeconds from today sessions
    - Aggregates weekDayTotals: bucket sessions by `startTime` day-of-week (local time), Mon=0…Sun=6
    - Aggregates monthSeconds: sum all watchedSeconds from month sessions
    - Sets loading=true during fetch, loading=false when done
    - On error: sets error, loading=false
    - `refetch()` re-runs all 3 queries

Edge cases:
  - All three queries return [] → todaySeconds=0, weekDayTotals=[0,0,0,0,0,0,0], monthSeconds=0
  - Session spanning midnight: counted on `startTime` day only
  - Called with empty uid/childProfileId: should not fire queries (guard early return)

Test Requirements:
  Mock `fetchSessionsSince` (vi.mock or vi.fn)
  - "should return loading=true on initial fetch"
  - "should aggregate today seconds from sessions"
  - "should bucket sessions into correct weekday slots"
  - "should set error when fetchSessionsSince throws"
  - "should not fire queries when uid or childProfileId is empty"

Implementation Notes:
  - Use `useCallback` + `useEffect` pattern
  - `startOfToday()`, `startOfWeek()`, `startOfMonth()` from `@ckd/shared/utils/dateRanges`
  - `formatSeconds` is NOT used here — hook returns raw seconds, component formats them
  - weekDayTotals bucket: `const dayIdx = (session.startTime.toDate().getDay() + 6) % 7` (Mon=0)
  - week sessions suffice for weekDayTotals (no need for month query overlap)

---

### Task 6 of 9: WatchTimeChart Component

Type: Feature

Files:
  Test: `apps/web/src/features/dashboard/components/__tests__/WatchTimeChart.test.tsx`
  Implementation: `apps/web/src/features/dashboard/components/WatchTimeChart.tsx`

What to Build:
  ```tsx
  interface WatchTimeChartProps {
    weekDayTotals: number[]  // [Mon…Sun], length 7
    todayDayIndex: number    // 0=Mon…6=Sun
  }
  function WatchTimeChart({ weekDayTotals, todayDayIndex }: WatchTimeChartProps): JSX.Element
  ```
  Visual spec (from story-8.md design refs):
    - Container: flex row, justify-content: space-between, align-items: flex-end
    - Each bar column: 8px wide, max-height 120px, position relative
    - Track (background): full height #E9D5FF, border-radius 4px
    - Filled bar: height proportional to max value in week; today → #9333EA, others → #C4B5FD
    - Minimum filled bar height: 4px (even if 0 seconds)
    - Day labels below: "M T W T F S S", 11px Nunito, #6B7280, text-align center
    - data-testid="chart-bar" on each bar element
    - data-today="true" on today's bar
    - Container: data-testid="watch-time-chart"

Edge cases:
  - All 7 values are 0 → all bars at 4px min height
  - One value is much larger than others → that bar near 120px, others proportional
  - todayDayIndex out of range (guard) → no today highlight

Test Requirements:
  - "should render 7 bars"
  - "should mark today's bar with data-today=true"
  - "should give all-zero bars a minimum height of 4px"
  - "should scale bars proportionally to max value"

Implementation Notes:
  - Height calculation: `Math.max(4, (seconds / maxSeconds) * 120)` where maxSeconds = Math.max(...weekDayTotals, 1)
  - No SVG or chart library — pure div + inline styles
  - The filled bar sits inside the track div (absolute or flex column approach)

---

### Task 7 of 9: DashboardScreen Component (includes ShimmerSkeleton)

Type: Feature

Files:
  Test: `apps/web/src/features/dashboard/components/__tests__/DashboardScreen.test.tsx`
  Implementation: `apps/web/src/features/dashboard/components/DashboardScreen.tsx`

What to Build:
  ```tsx
  interface DashboardScreenProps {
    db: Firestore
    uid: string
    childProfileId: string
  }
  function DashboardScreen({ db, uid, childProfileId }: DashboardScreenProps): JSX.Element
  ```
  States:
    - Loading → `<ShimmerSkeleton data-testid="dashboard-shimmer" />`
    - Error → error message + retry button (data-testid="dashboard-error", "retry-btn")
    - Empty (all seconds === 0 AND no sessions ever) → empty state (data-testid="dashboard-empty-state")
    - Data → today label + today value + WatchTimeChart + monthly total

  Today value format (from story-8.md):
    - "Today" label: Nunito SemiBold 13px, #6B7280
    - Today value: `formatSeconds(todaySeconds)`, Baloo 2 ExtraBold 28px, #9333EA, data-testid="today-value"
    - Monthly total: "This month: {formatSeconds(monthSeconds)}", Nunito SemiBold 15px, #1E1B4B, data-testid="monthly-total"

  ShimmerSkeleton (inline in same file or exported separately):
    - Renders skeleton shape for: today block (80px wide, 36px tall) + 7 bar stubs + monthly line
    - CSS animation: shimmer left-to-right using `@keyframes shimmer` with background gradient

  Empty state condition:
    - `todaySessions.length === 0 AND weekSessions.length === 0 AND monthSessions.length === 0`
    - NOT triggered by "0 seconds watched" — triggered by "no sessions at all"

Edge cases:
  - todaySeconds = 0, weekSessions exist → show chart (not empty state)
  - Retry should call `refetch()` from `useDashboard`

Test Requirements:
  Mock `useDashboard` (vi.mock)
  - FT-4: "shows shimmer when loading=true"
  - FT-5: "shows error + retry when error set; retry calls refetch"
  - "shows empty state when all session arrays empty"
  - "shows today value with formatSeconds output"
  - "shows monthly total with formatSeconds output"

Implementation Notes:
  - Import `useDashboard` (mocked in tests), `WatchTimeChart`, `formatSeconds` from shared
  - `todayDayIndex`: compute from `new Date().getDay()` → `(day + 6) % 7`
  - Keep ShimmerSkeleton as a local sub-component in same file (single use)

---

### Task 8 of 9: ParentPanel Side Drawer

Type: Feature

Files:
  Test: none (visual — covered by FT-7 E2E)
  Implementation: `apps/web/src/features/dashboard/components/ParentPanel.tsx`

What to Build:
  ```tsx
  interface ParentPanelProps {
    db: Firestore
    uid: string
    childProfileId: string
    onClose: () => void
  }
  function ParentPanel({ db, uid, childProfileId, onClose }: ParentPanelProps): JSX.Element
  ```
  Layout (web — side drawer per Design.md §9):
    - Full-height overlay: fixed position, inset 0, background rgba(0,0,0,0.4)
    - Drawer panel: slides in from right, width 320px (or 100% on < 480px), height 100vh
    - Background: #FAFAFA, border-radius 24px 0 0 24px (top-left, top-right, bottom-right, bottom-left)
    - Drag handle styled element at top (visual only — 32px wide, 4px tall, #D1D5DB, centered)
    - Close button (×): top-right corner, data-testid="panel-close-btn"
    - Overlay click → calls onClose
    - Panel root: data-testid="parent-panel"
    - Contains: `<DashboardScreen db={db} uid={uid} childProfileId={childProfileId} />`
    - Slide-in animation: CSS transition, transform translateX(100%) → translateX(0), 250ms ease-out

Edge cases:
  - Click on panel itself must NOT propagate to overlay (stopPropagation)
  - On very small screens (< 480px): drawer is full width, no border-radius on right side

Implementation Notes:
  - No third-party sheet library — pure CSS + React state
  - Use `useEffect` to add/remove `overflow: hidden` on body while panel is open (prevent background scroll)
  - Cleanup `overflow` on unmount

---

### Task 9 of 9: Wire ParentPanel into LibraryPage

Type: Feature

Files:
  Test: (FT-1, FT-7 E2E cover this)
  Implementation: `apps/web/src/pages/LibraryPage.tsx` (modify)

What to Build:
  Replace:
  ```tsx
  {panelVisible && <div data-testid="parent-panel">Parent Panel (Story 8)</div>}
  ```
  With:
  ```tsx
  {panelVisible && (
    <ParentPanel
      db={db}
      uid={user.uid}
      childProfileId={childProfile.childProfileId}
      onClose={() => setPanelVisible(false)}
    />
  )}
  ```
  Where:
  - `user` comes from `useAuthStore()` or `onAuthStateChanged` already available
  - `childProfile` comes from `useChildProfileStore()`
  - `db` already imported in LibraryPage

Edge cases:
  - childProfileId may be undefined if store not yet loaded → guard: if no childProfile, show loading/spinner inside panel (DashboardScreen handles it via empty uid guard)
  - Guard: `if (!childProfile || !user) return null` inside ParentPanel as fallback

Implementation Notes:
  - Import `ParentPanel` from `../features/dashboard/components/ParentPanel`
  - Import `useChildProfileStore` from `../shared/store/childProfileStore`
  - The `db` import is already present in LibraryPage (passed to `useVideoLibrary`)
  - Check childProfileStore interface — `state.childProfile` or `state.activeProfile` — read the file before editing

---

## Known Test Gaps

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Shimmer timing (E2E) | Playwright cannot reliably intercept Firebase SDK WebSocket/gRPC — loading state resolves before assertion | Covered by FT-4 unit test |
| Error state (E2E) | Cannot inject Firestore failure mid-test via Playwright without complex service-worker interception | Covered by FT-5 unit test |
| Timezone edge cases (E2E) | Device timezone cannot be set per-test in Playwright without browser flags | Covered by dateRanges.test.ts unit tests |
