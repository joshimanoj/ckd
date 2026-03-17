# PRD: Story #7 — Video Player & Watch Session Tracking (Web Pass)

**Branch:** feature/story-7-video-player-watch-session-web
**Pass:** 1 — Web | **Type:** UI | **Sprint:** 2
**Tech stack:** React 18 + Vite + TypeScript | Vitest + React Testing Library | Playwright
**Design ref:** story-7-ui-context.md
**Output:** prd-7-web.md → completed/ when /check and /uat pass

---

## Track B — Functional Tests (write FIRST, start RED)

All FTs must be fully executable at write time — no stubs. Firebase emulator required for integration FTs.

---

### Functional Test FT-1: Full-screen player, no bottom navigation

**Criterion (from story-7.md):** Player renders full-screen, no bottom navigation bar
**Test File:** `apps/web/e2e/story-7/player-fullscreen.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed one video in Firebase emulator
- Sign in as test user with child profile
- Navigate to `/watch/test-video-1`

**User Flow:**
1. Navigate to `/watch/test-video-1`
2. Assert the player container occupies the full viewport (bounding box matches window size)
3. Assert no bottom navigation bar is visible (data-testid="bottom-nav" not present or hidden)
4. Assert no bottom tab bar element is rendered

**Assertions:**
- `page.locator('[data-testid="player-screen"]')` bounding box width equals viewport width
- `page.locator('[data-testid="bottom-nav"]')` count is 0 OR not visible
- `page.locator('[data-testid="player-screen"]')` is visible

**Initial Status:** RED

---

### Functional Test FT-2: YouTube iframe embed params

**Criterion (from story-7.md):** YouTube embed configured exactly: rel=0, modestbranding=1, controls=0, autoplay=1
**Test File:** `apps/web/e2e/story-7/youtube-embed-params.spec.ts`
**Framework:** Playwright

**Setup:**
- Navigate to `/watch/test-video-1` with videoId `dQw4w9WgXcQ`

**User Flow:**
1. Navigate to `/watch/test-video-1`
2. Wait for iframe to mount
3. Read the iframe `src` attribute

**Assertions:**
- `iframe[data-testid="youtube-player"]` src contains `rel=0`
- src contains `modestbranding=1`
- src contains `controls=0`
- src contains `autoplay=1`
- src contains the video ID `dQw4w9WgXcQ`

**Initial Status:** RED

---

### Functional Test FT-3: Play/pause button visible and functional

**Criterion (from story-7.md):** Custom play/pause control visible and functional
**Test File:** `apps/web/e2e/story-7/player-controls.spec.ts`
**Framework:** Playwright

**Setup:**
- Navigate to `/watch/test-video-1`

**User Flow:**
1. Navigate to `/watch/test-video-1`
2. Assert play/pause button is visible
3. Assert button bounding box is at least 56×56px
4. Click the play/pause button
5. Assert button aria-label toggles between "Pause" and "Play"

**Assertions:**
- `[data-testid="play-pause-btn"]` is visible
- Bounding box `.width >= 56` and `.height >= 56`
- After click: aria-label is "Pause" (video now playing) or "Play" (video now paused)

**Initial Status:** RED

---

### Functional Test FT-4: Back button returns to Library

**Criterion (from story-7.md):** Back button returns to Library and triggers session write
**Test File:** `apps/web/e2e/story-7/back-to-library.spec.ts`
**Framework:** Playwright

**Setup:**
- Navigate to `/watch/test-video-1`

**User Flow:**
1. Navigate to `/watch/test-video-1`
2. Assert back button is visible with minimum 44×44px tap area
3. Click the back button
4. Assert URL is `/library`

**Assertions:**
- `[data-testid="back-btn"]` is visible
- Bounding box `.width >= 44` and `.height >= 44`
- After click: `page.url()` ends with `/library`

**Initial Status:** RED

---

### Functional Test FT-5: Watch session initialized on video start

**Criterion (from story-7.md):** Watch session begins on video start: startTime, youtubeVideoId, childProfileId set in watchSessionStore
**Test File:** `apps/web/src/features/videoPlayer/hooks/__tests__/useWatchSession.init.test.ts`
**Framework:** Vitest + React Testing Library

**Setup:**
- Mock YouTube player ref with `getCurrentTime` returning 0
- Provide `videoId: 'dQw4w9WgXcQ'`, `childProfileId: 'child-1'`, `videoDuration: 180`

**User Flow:**
1. Render `useWatchSession` hook with test params
2. Simulate player `onReady` event (video starts)
3. Read watchSessionStore state

**Assertions:**
- `watchSessionStore.getState().youtubeVideoId === 'dQw4w9WgXcQ'`
- `watchSessionStore.getState().childProfileId === 'child-1'`
- `watchSessionStore.getState().startTime` is a non-null Timestamp
- `watchSessionStore.getState().watchedSeconds === 0`

**Initial Status:** RED

---

### Functional Test FT-6: Single Firestore write on pause and back (no duplicate writes)

**Criterion (from story-7.md):** On pause or end: single Firestore write to watchSessions collection; no duplicate writes
**Test File:** `apps/web/src/features/videoPlayer/services/__tests__/watchSessionService.test.ts`
**Framework:** Vitest + Firebase Local Emulator

**Setup:**
- Firebase emulator running on default ports
- Authenticated test user with child profile in emulator
- Session payload: `{ youtubeVideoId, videoDurationSeconds: 180, watchedSeconds: 45, ... }`

**User Flow:**
1. Call `writeWatchSession(userId, childProfileId, sessionPayload)` once
2. Query `watchSessions` collection in emulator
3. Call `writeWatchSession` again with same payload (simulate double-tap)
4. Query again

**Assertions:**
- After first call: exactly 1 document in `watchSessions`
- Document fields match payload (youtubeVideoId, watchedSeconds, completionPercent: 25)
- After second call (guard): still exactly 1 document (write guard prevents duplicate)

**Known limitation:** "Double-tap guard" is a `hasWritten` flag in `useWatchSession` — tested here via service isolation + flag in hook unit tests.

**Initial Status:** RED

---

### Functional Test FT-7: completionPercent calculation and divide-by-zero guard

**Criterion (from story-7.md):** completionPercent calculated as watchedSeconds / videoDurationSeconds * 100 (rounded); defaults to 0 when videoDurationSeconds is 0
**Test File:** `packages/shared/src/utils/__tests__/watchTime.test.ts`
**Framework:** Vitest

**User Flow:**
1. Call `calcCompletionPercent(45, 180)` → assert 25
2. Call `calcCompletionPercent(180, 180)` → assert 100
3. Call `calcCompletionPercent(0, 0)` → assert 0 (no crash)
4. Call `calcCompletionPercent(10, 0)` → assert 0 (no crash)
5. Call `calcCompletionPercent(90, 180)` → assert 50

**Assertions:**
- All above return values match exactly (Math.round applied)
- No exception thrown in any case

**Initial Status:** RED

---

### Functional Test FT-8: Auto-advance to next video; wraps to first at end of library

**Criterion (from story-7.md):** Auto-advance to next video on 'ended' state; wraps to first video at end of library
**Test File:** `apps/web/e2e/story-7/auto-advance.spec.ts`
**Framework:** Playwright

**Setup:**
- Seed 3 videos in emulator: video-1, video-2, video-3 (in order)
- Navigate to `/watch/video-1`

**User Flow:**
1. Navigate to `/watch/video-1`
2. Simulate `onStateChange('ended')` via `page.evaluate(() => window.__simulateVideoEnd())`
3. Assert URL changes to `/watch/video-2`
4. Navigate directly to `/watch/video-3`
5. Simulate ended
6. Assert URL wraps back to `/watch/video-1`

**Assertions:**
- After video-1 ends: URL ends with `/watch/video-2`
- After video-3 ends: URL ends with `/watch/video-1`

**Note:** PlayerScreen must expose `window.__simulateVideoEnd` in test mode (guarded by `import.meta.env.TEST`).

**Initial Status:** RED

---

### Functional Test FT-9: Error state shown on video load failure; retry reinitializes

**Criterion (from story-7.md):** Video load failure shows inline error state with retry button
**Test File:** `apps/web/e2e/story-7/error-state.spec.ts`
**Framework:** Playwright

**Setup:**
- Navigate to `/watch/test-video-1`

**User Flow:**
1. Navigate to `/watch/test-video-1`
2. Simulate iframe error via `page.evaluate(() => window.__simulatePlayerError())`
3. Assert error state is visible
4. Assert error text contains "Check your internet connection"
5. Click retry button
6. Assert error state is dismissed and player reinitializes (loading state visible)

**Assertions:**
- `[data-testid="player-error"]` is visible after error simulation
- Error text `toContain("Check your internet connection")`
- `[data-testid="retry-btn"]` is visible
- After retry click: `[data-testid="player-error"]` not visible, `[data-testid="player-loading"]` or `[data-testid="youtube-player"]` visible

**Initial Status:** RED

---

### Functional Test FT-10: Responsive layout — 480–768px viewport; no horizontal scroll < 480px

**Criterion (from story-7.md):** Renders correctly at 480–768px; no horizontal scroll at < 480px
**Test File:** `apps/web/e2e/story-7/responsive.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Set viewport to `{ width: 480, height: 844 }` → navigate to `/watch/test-video-1` → assert no horizontal scrollbar, player fills width
2. Set viewport to `{ width: 768, height: 1024 }` → navigate → assert player fills width, controls visible
3. Set viewport to `{ width: 375, height: 812 }` (< 480px) → assert `document.documentElement.scrollWidth <= 375` (no horizontal overflow)

**Assertions:**
- At 480px: `[data-testid="player-screen"]` width equals viewport width; no horizontal scroll
- At 768px: player fills viewport; no overflow
- At 375px: `document.body.scrollWidth <= viewport.width` (no horizontal scroll)

**Initial Status:** RED

---

## Track A — Implementation Tasks

---

### Task 1 of 14: WatchSession shared type

**Type:** Feature

**Files:**
- Test: `packages/shared/src/types/__tests__/watchSession.test.ts`
- Implementation: `packages/shared/src/types/watchSession.ts`

**What to Build:**
- Export `WatchSession` interface matching architecture.md §3 data model exactly
- Fields: `sessionId`, `youtubeVideoId`, `videoDurationSeconds`, `watchedSeconds`, `completionPercent`, `startTime`, `endTime`, `deviceType`, `createdAt`
- Export `DeviceType` union type: `'android' | 'web'`
- Export `WatchSessionInput` (omit `sessionId`, `createdAt` — set by Firestore)

**Test Requirements:**
- Input: construct a `WatchSession` object with all fields
- Expected: TypeScript compilation passes (no runtime assertions needed — type-only test)
- Test description: "WatchSession interface satisfies all required fields"
- Verify `DeviceType` accepts `'web'` and `'android'` but not `'ios'` (TypeScript-level)

**Implementation Notes:**
- Use Firebase `Timestamp` type from `firebase/firestore`
- Keep in `packages/shared` so both web and mobile import the same type
- `endTime: Timestamp | null` — null when session ended unexpectedly

---

### Task 2 of 14: watchTime utilities

**Type:** Feature

**Files:**
- Test: `packages/shared/src/utils/__tests__/watchTime.test.ts`
- Implementation: `packages/shared/src/utils/watchTime.ts`

**What to Build:**
- `calcCompletionPercent(watchedSeconds: number, videoDurationSeconds: number): number`
  - Returns `Math.round(watchedSeconds / videoDurationSeconds * 100)`
  - Returns `0` when `videoDurationSeconds === 0` (divide-by-zero guard)
  - Clamps to `[0, 100]` (cannot exceed 100%)
- `formatSeconds(totalSeconds: number): string`
  - Returns `"X hr Y min"` for >= 3600s
  - Returns `"Y min"` for < 3600s
  - Returns `"< 1 min"` for < 60s

**Test Requirements:**
- `calcCompletionPercent(45, 180)` → 25
- `calcCompletionPercent(180, 180)` → 100
- `calcCompletionPercent(0, 0)` → 0 (no throw)
- `calcCompletionPercent(10, 0)` → 0 (no throw)
- `calcCompletionPercent(181, 180)` → 100 (clamped)
- `formatSeconds(3661)` → "1 hr 1 min"
- `formatSeconds(90)` → "1 min"
- `formatSeconds(30)` → "< 1 min"

---

### Task 3 of 14: watchSessionStore (Zustand)

**Type:** Feature

**Files:**
- Test: `apps/web/src/shared/store/__tests__/watchSessionStore.test.ts`
- Implementation: `apps/web/src/shared/store/watchSessionStore.ts`

**What to Build:**
- Zustand store with state:
  ```ts
  {
    youtubeVideoId: string | null
    childProfileId: string | null
    videoDurationSeconds: number
    watchedSeconds: number
    lastKnownTime: number
    startTime: Timestamp | null
    hasWritten: boolean   // write guard — prevents duplicate Firestore writes
  }
  ```
- Actions:
  - `initSession(videoId, childProfileId, durationSeconds)` — sets startTime to Timestamp.now(), resets counters, clears hasWritten
  - `addWatchedDelta(delta: number)` — `watchedSeconds += delta`
  - `updateLastKnownTime(currentTime: number)` — update lastKnownTime
  - `markWritten()` — sets `hasWritten: true`
  - `resetSession()` — clears all fields to initial state

**Test Requirements:**
- `initSession('abc', 'child-1', 180)` → state has correct videoId, childProfileId, startTime != null, watchedSeconds === 0, hasWritten === false
- `addWatchedDelta(10)` → watchedSeconds === 10
- `addWatchedDelta(5)` → watchedSeconds === 15
- `markWritten()` → hasWritten === true
- `resetSession()` → all fields reset to null/0/false
- Two calls to `initSession` → hasWritten resets to false (new session guard)

---

### Task 4 of 14: watchSessionService — Firestore write

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/services/__tests__/watchSessionService.test.ts`
- Implementation: `apps/web/src/features/videoPlayer/services/watchSessionService.ts`

**What to Build:**
- `writeWatchSession(userId: string, childProfileId: string, payload: WatchSessionInput): Promise<string>`
  - Calls `addDoc` on `users/{userId}/childProfiles/{childProfileId}/watchSessions`
  - Sets `endTime: Timestamp.now()`, `createdAt: serverTimestamp()`, `deviceType: 'web'`
  - Returns the new document ID
- Uses `calcCompletionPercent` from shared utils

**Edge cases:**
- `payload.videoDurationSeconds === 0` → completionPercent = 0 (not NaN)
- Firebase write failure → throws (caller handles)

**Test Requirements (Vitest + Firebase emulator):**
- Input: `userId: 'user-1'`, `childProfileId: 'child-1'`, `payload: { youtubeVideoId: 'abc', videoDurationSeconds: 180, watchedSeconds: 45, startTime: Timestamp.now() }`
- Expected: document created in emulator at correct path; `completionPercent === 25`; `deviceType === 'web'`; `endTime !== null`

**Implementation Notes:**
- Import `db` from `../../shared/firebase/config` (or `packages/shared`)
- Collection path must exactly match architecture.md §3: `users/{userId}/childProfiles/{childProfileId}/watchSessions`

---

### Task 5 of 14: useWatchSession hook — session initialization

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/hooks/__tests__/useWatchSession.init.test.ts`
- Implementation: `apps/web/src/features/videoPlayer/hooks/useWatchSession.ts` (create file)

**What to Build:**
Hook signature:
```ts
useWatchSession(params: {
  videoId: string
  childProfileId: string
  videoDuration: number
  playerRef: RefObject<YouTubePlayerRef>
  userId: string
})
```
- On mount: calls `watchSessionStore.initSession(videoId, childProfileId, videoDuration)`
- Returns: `{ flushSession: () => Promise<void> }` — callable by PlayerScreen on pause/end/back

**Test Requirements:**
- Render hook with mock params
- Assert `watchSessionStore.getState().youtubeVideoId === videoId` after mount
- Assert `watchSessionStore.getState().startTime !== null`
- Assert `watchSessionStore.getState().watchedSeconds === 0`

---

### Task 6 of 14: useWatchSession hook — 10-second polling + cleanup

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/hooks/__tests__/useWatchSession.polling.test.ts`
- Implementation: `apps/web/src/features/videoPlayer/hooks/useWatchSession.ts` (extend)

**What to Build:**
- `setInterval` every 10 000ms inside the hook:
  ```
  delta = currentTime - lastKnownTime
  watchedSeconds += delta
  lastKnownTime = currentTime
  ```
- Calls `playerRef.current.getCurrentTime()` each tick
- On component unmount: `clearInterval` — no memory leak
- `flushSession()`:
  1. Compute final delta from last tick to now
  2. Guard: if `hasWritten === true` → return (no duplicate write)
  3. Assemble payload from store state
  4. Call `writeWatchSession(userId, childProfileId, payload)`
  5. Call `markWritten()`

**Test Requirements (Vitest + fake timers):**
- Mock `playerRef.current.getCurrentTime` returning 10, then 20, then 30
- Advance fake timer by 30 000ms (3 ticks)
- Assert `watchSessionStore.getState().watchedSeconds === 30`
- Assert `watchSessionStore.getState().lastKnownTime === 30`
- Unmount hook → advance timer → assert `getCurrentTime` not called again (interval cleaned up)
- Call `flushSession()` twice → assert `writeWatchSession` called exactly once (hasWritten guard)

---

### Task 7 of 14: YouTube iframe PlayerScreen — layout + embed params

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/components/__tests__/PlayerScreen.params.test.tsx`
- Implementation: `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx` (create)

**What to Build:**
```tsx
<div data-testid="player-screen" style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 50 }}>
  <iframe
    data-testid="youtube-player"
    src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&controls=0&autoplay=1&enablejsapi=1`}
    allow="autoplay; fullscreen"
    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
  />
  <PlayerControls ... />
</div>
```
- `youtubeVideoId` from React Router `useParams({ from: '/watch/$videoId' })`
- `enablejsapi=1` required for YouTube iFrame API events (state changes)
- Loading state shown until `onLoad` fires on the iframe (or `onStateChange('playing')` via postMessage)

**Test Requirements:**
- Render `<PlayerScreen videoId="dQw4w9WgXcQ" ... />`
- Assert `data-testid="player-screen"` is in document
- Assert `data-testid="youtube-player"` src contains `rel=0`, `modestbranding=1`, `controls=0`, `autoplay=1`
- Assert `data-testid="youtube-player"` src contains `dQw4w9WgXcQ`
- Assert no bottom nav bar rendered inside PlayerScreen

---

### Task 8 of 14: PlayerControls — play/pause button

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/components/__tests__/PlayerControls.test.tsx`
- Implementation: `apps/web/src/features/videoPlayer/components/PlayerControls.tsx` (create)

**What to Build:**
```tsx
interface PlayerControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onBack: () => void
}
```
- Bottom bar: `position: absolute`, `bottom: 0`, `left: 0`, `right: 0`, height: `120px`, background: `rgba(0,0,0,0.4)`
- Play/Pause button: `width: 56px`, `height: 56px`, `border-radius: 50%`, `background: rgba(0,0,0,0.6)`, centered in bottom bar
- Icon: white, 32px — use `▶` / `⏸` or icon library
- `data-testid="play-pause-btn"`, `aria-label={isPlaying ? 'Pause' : 'Play'}`
- Clicking calls `onPlayPause`
- Manages player play/pause by posting message to iframe (or via YouTube iFrame API `postMessage`)

**Test Requirements:**
- Render `<PlayerControls isPlaying={false} onPlayPause={mock} onBack={mock} />`
- Assert `data-testid="play-pause-btn"` has `aria-label="Play"`
- Render with `isPlaying={true}` → `aria-label="Pause"`
- Click play/pause → `onPlayPause` called once
- Assert button computed style `width: 56px` / `height: 56px` OR bounding box assertion

---

### Task 9 of 14: PlayerControls — back button

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/components/__tests__/PlayerControls.test.tsx` (extend)
- Implementation: `apps/web/src/features/videoPlayer/components/PlayerControls.tsx` (extend)

**What to Build:**
- Top bar: `position: absolute`, `top: 0`, `left: 0`, `right: 0`, height: `56px`, background: `rgba(0,0,0,0.4)`
- Back button: top-left, `min-width: 44px`, `min-height: 44px`, white `←` icon or `‹` chevron
- `data-testid="back-btn"`, `aria-label="Back to Library"`
- Clicking calls `onBack`

**Test Requirements:**
- `data-testid="back-btn"` visible
- `aria-label="Back to Library"`
- Click → `onBack` called once
- Inline style or computed style: `minWidth >= 44px`, `minHeight >= 44px`

---

### Task 10 of 14: Player loading state

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/components/__tests__/PlayerScreen.states.test.tsx`
- Implementation: `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx` (extend)

**What to Build:**
- `isLoading` state: `true` until iframe fires `onLoad` event
- While loading: render `<div data-testid="player-loading">` — black full-screen overlay with centered white spinner
- After load: `isLoading = false` → hide loading overlay, show iframe + controls
- CSS spinner: `@keyframes spin`, `border: 4px solid rgba(255,255,255,0.2)`, `border-top: 4px solid #fff`, `border-radius: 50%`, `width: 40px`, `height: 40px`

**Test Requirements:**
- On initial render (before iframe load): `data-testid="player-loading"` visible
- After firing `iframe.onLoad` event: `data-testid="player-loading"` not visible
- `data-testid="youtube-player"` visible after load

---

### Task 11 of 14: Player error state

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/components/__tests__/PlayerScreen.states.test.tsx` (extend)
- Implementation: `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx` (extend)

**What to Build:**
- `hasError` state: set to `true` when YouTube postMessage delivers `onError` state, or via `window.__simulatePlayerError()` in test mode
- Error overlay: `data-testid="player-error"`, black full-screen, centered column
  - Text: "Oops! Check your internet connection." — Nunito Regular 16sp, white
  - Button `data-testid="retry-btn"`, aria-label="Try again" — outlined white, pill
  - Clicking retry: resets `hasError = false`, increments a `playerKey` to remount the iframe

**Edge cases:**
- `window.__simulatePlayerError` only attached in `import.meta.env.MODE === 'test'`

**Test Requirements:**
- Simulate error → `data-testid="player-error"` visible
- Error text contains "Check your internet connection"
- Click retry → `data-testid="player-error"` not visible
- `data-testid="youtube-player"` re-rendered (key changed)

---

### Task 12 of 14: Auto-advance logic

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoPlayer/components/__tests__/PlayerScreen.autoadvance.test.tsx`
- Implementation: `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx` (extend)

**What to Build:**
- Listen to YouTube `onStateChange` via `window.addEventListener('message', ...)` (postMessage from iframe)
- Parse `event.data.event === 'onStateChange'` and `event.data.info === 0` (ended)
- Also expose `window.__simulateVideoEnd()` in test mode
- On `'ended'`:
  1. Call `flushSession()` (write to Firestore)
  2. Compute `nextIndex = (currentIndex + 1) % videos.length`
  3. Navigate to `/watch/${videos[nextIndex].videoId}`
- `currentIndex` = index of current `videoId` in `videoStore.videos`
- If `videos` array is empty → stay on current screen (guard)

**Test Requirements:**
- Mock `videoStore` with 3 videos: ['v1', 'v2', 'v3']
- Start on v1 → simulate ended → assert navigate called with `/watch/v2`
- Start on v3 → simulate ended → assert navigate called with `/watch/v1` (wrap)
- `flushSession` called on ended

---

### Task 13 of 14: WatchPage — wire everything together + session write guards

**Type:** Feature

**Files:**
- Test: `apps/web/src/pages/__tests__/WatchPage.test.tsx`
- Implementation: `apps/web/src/pages/WatchPage.tsx` (replace stub)

**What to Build:**
- Replace stub with real implementation:
  ```tsx
  export function WatchPage() {
    const { videoId } = useParams<{ videoId: string }>()
    const { user } = useAuthStore()
    const { activeProfile } = useChildProfileStore()
    const videos = useVideoStore(s => s.videos)
    const video = videos.find(v => v.videoId === videoId)
    const playerRef = useRef<YouTubePlayerRef>(null)
    const { flushSession } = useWatchSession({
      videoId: video?.youtubeVideoId ?? '',
      childProfileId: activeProfile?.childProfileId ?? '',
      videoDuration: video?.durationSeconds ?? 0,
      playerRef,
      userId: user?.uid ?? '',
    })
    // Pass flushSession to PlayerScreen for back/pause/end events
    return <PlayerScreen video={video} playerRef={playerRef} flushSession={flushSession} />
  }
  ```
- Guard: if `video` not found in store → navigate to `/library` (invalid videoId)
- Guard: if `user` or `activeProfile` null → navigate to `/` (unauthenticated)

**Test Requirements:**
- Render `<WatchPage />` with videoId in params, mock stores populated
- Assert `data-testid="player-screen"` rendered
- Mock stores with no matching video → assert navigate called with `/library`

---

### Task 14 of 14: Responsive CSS — mobile viewport + top nav

**Type:** Feature

**Files:**
- Test: `apps/web/e2e/story-7/responsive.spec.ts` (FT-10 — already defined above)
- Implementation: `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx` (CSS)

**What to Build:**
- `PlayerScreen` uses `position: fixed; inset: 0` — fills entire browser viewport on mobile web
- `overflow: hidden` on player container — no scrollbars inside player
- Top nav: render existing `<TopNav />` (from Story 5/6 web work) as a transparent overlay at top of player — `position: absolute; top: 0; left: 0; right: 0; z-index: 60` — it sits above the controls scrim
- OR: if back button in PlayerControls top bar is sufficient, top nav is only rendered outside the player (on Library screen). Per Design.md §9: "Bottom navigation replaced by top navigation bar" — top nav is the site-level nav, not a duplicate of the back button. Clarification: top nav on /watch route = same TopNav as /library, rendered above the full-screen player as a fixed overlay.
- CSS to add to `apps/web/src/index.css` or component module:
  ```css
  /* Prevent horizontal overflow at < 480px on player screen */
  [data-testid="player-screen"] {
    max-width: 100vw;
    overflow-x: hidden;
  }
  ```

**Test Requirements:**
- Playwright FT-10: viewport 480px → no horizontal scroll; viewport 375px → `scrollWidth <= viewportWidth`
- Viewport 768px → player fills width

---

## Known Test Gaps

| Gap | Reason | Resolution |
|---|---|---|
| YouTube iframe postMessage events in Playwright | YouTube iframe is cross-origin; Playwright cannot directly inject postMessage from the outer page into a cross-origin iframe | `window.__simulateVideoEnd()` and `window.__simulatePlayerError()` hooks exposed in test mode only (`import.meta.env.MODE === 'test'`) |
| Real YouTube video playback in E2E | YouTube requires network; CI may not have access | E2E tests use the test mode hooks for state changes; real playback tested manually in UAT |
| 10-second polling Firestore writes | Cannot verify "no write per tick" in Playwright without emulator access | Covered by Vitest unit test (FT-6 / Task 6) |
