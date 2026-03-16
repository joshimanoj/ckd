# Story 7: Video Player & Watch Session Tracking

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 2 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent or child
I want to watch a Choti Ki Duniya video full-screen with no ads, no interruptions, and no links to other channels
So that the viewing experience is safe, seamless, and controlled

---

### Context

Playing a video is the single most important action in the app. The player wraps the YouTube iFrame API via `react-native-youtube-iframe` — YouTube handles streaming, the app controls the UI. The player must enforce specific YouTube embed parameters (rel=0, modestbranding=1, controls=0) to prevent ads and external recommendations. The app builds its own play/pause/back UI on top.

Watch session tracking is inseparable from the player: a session begins when a video starts, is accumulated in memory via 10-second polling, and is written to Firestore in a single write on pause or video end. This is the analytics layer that powers the Dashboard (Story 8).

---

### Problem Statement

**Current State:** Children watch on YouTube directly, which plays pre-roll ads, shows competitor channel recommendations after each video, and has no branded environment.

**Pain Points:**
- Ads appearing mid-watch destroys the child's experience and the parent's trust
- YouTube recommendations after video ends lead to other channels (safety concern)
- No watch time data is captured for the parent dashboard

**Desired State:** Full-screen branded player. Video plays with no ads, no external recommendations. On video end, auto-advances to next video in library. Watch time is silently tracked and written to Firestore.

---

### User Flow

**Trigger:** Child or parent taps a video card in the Video Library.

**Steps:**
1. Player screen pushes in (full-screen, no bottom bar, swipe-to-go-back disabled)
2. `react-native-youtube-iframe` renders with:
   - `videoId` from navigation params
   - `rel=0` — end-of-video recommendations limited to this channel
   - `modestbranding=1` — minimal YouTube branding
   - `controls=0` — YouTube controls hidden; app renders its own
   - `autoplay=1` — video begins immediately
3. Watch session begins: `watchSessionStore` initialised with `startTime`, `youtubeVideoId`, `childProfileId`
4. 10-second polling interval begins: `player.getCurrentTime()` called every 10 seconds → delta added to `watchedSeconds` in Zustand store (memory only — no Firestore write per tick)
5. Custom player controls overlay (bottom of screen):
   - Play/Pause button (56dp, white icon on semi-transparent dark background)
   - Back to Library button (top-left, 44×44dp)
6. Video ends → `onChangeState` fires with `'ended'` → auto-advance to next video in `videoStore` sequence (or loop to first if at end)
7. On pause or end → `watchSessionStore` state assembled into session payload → `addDoc` to `watchSessions` collection → Firestore write (single write per session)
8. Parent taps back → player dismissed → session written to Firestore → returns to Library

**Auto-advance logic:**
- Current `videoId` index in `videoStore.videos` array → next index → if end of array → index 0
- No category filter applied to auto-advance in V1 — advances through full library

**Polling logic:**
```
Every 10s: delta = currentTime - lastKnownTime
           watchedSeconds += delta
           lastKnownTime = currentTime
On pause:  flush delta + write to Firestore
On end:    flush delta + write to Firestore
On back:   flush delta + write to Firestore
```

**Alternatives / Error States:**
- Video fails to load (bad YouTube ID, network): friendly illustrated error within player area — "Oops! Check your internet connection." with Retry button (re-initialises player with same videoId)
- Network drops mid-video: YouTube player shows its own loading indicator; session still accumulates locally; written when player resumes and user navigates away
- App killed mid-session: `endTime` is `null` in Firestore (architecture.md allows this); `watchedSeconds` up to last written tick is retained

---

### Acceptance Criteria

**Functional:**
- [ ] Player renders full-screen, no bottom navigation bar, swipe-to-go-back disabled
- [ ] YouTube embed configured exactly: `rel=0`, `modestbranding=1`, `controls=0`, `autoplay=1`
- [ ] Custom play/pause control visible and functional
- [ ] Back button returns to Library and triggers session write
- [ ] Watch session begins on video start: `startTime`, `youtubeVideoId`, `childProfileId` set in `watchSessionStore`
- [ ] 10-second polling: `watchedSeconds` accumulated in memory (no Firestore write per tick)
- [ ] On pause or end: single Firestore write to `watchSessions` collection
- [ ] `completionPercent` calculated as `watchedSeconds / videoDurationSeconds * 100` (rounded integer)
- [ ] Auto-advance to next video on `'ended'` state; wraps to first video at end of library
- [ ] Video load failure shows inline error state with retry button

**Non-Functional:**
- [ ] Video playback begins < 2 seconds after tap (player pre-initialised before tap if possible)
- [ ] Play/Pause button minimum 56dp touch target
- [ ] Back button minimum 44×44dp touch target
- [ ] Polling interval cleaned up on component unmount (no memory leaks)
- [ ] YouTube logo not prominent (modestbranding=1 applied)
- [ ] No external link tappable from within the player screen
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] App killed mid-session → `endTime: null` written to Firestore on next session start (or left null — acceptable per architecture.md)
- [ ] Video ID in Firestore is invalid → YouTube player shows error → app shows friendly error state
- [ ] Child rapidly taps back/forward → no duplicate session writes (debounce/guard write)
- [ ] `videoDurationSeconds` is 0 in Firestore (admin entry error) → `completionPercent` defaults to 0 rather than divide-by-zero crash

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 3 (IA — Video Player), 4 (Flow 2), 7 (Interaction Patterns — Gestures)

**Key UI Elements:**
- Player screen: full black background (`#000000`) while video loads
- Custom controls overlay: semi-transparent dark scrim (rgba(0,0,0,0.4)) at bottom 120dp
- Play/Pause icon: white, 32dp icon inside 56dp circular button, `rgba(0,0,0,0.6)` background
- Back to Library: white left-arrow icon, top-left, 44×44dp tap area, same dark scrim strip at top
- Error state: centred illustration + "Oops! Check your internet connection." (Nunito Regular 16sp white) + "Try again" button (outlined white, pill)
- Loading state: black screen with centred `ActivityIndicator` (white) while YouTube player initialises

**Visual Requirements:**
- No YouTube branding visible in full-screen mode (modestbranding handles this)
- No category chips, no video title bar — full immersive view for child
- Player must feel like a native full-screen experience, not an embedded iframe

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/videoPlayer/components/PlayerScreen.tsx` (new)
- `apps/mobile/src/features/videoPlayer/components/PlayerControls.tsx` (new)
- `apps/mobile/src/features/videoPlayer/hooks/useWatchSession.ts` (new — polling + session accumulation)
- `apps/mobile/src/features/videoPlayer/services/watchSessionService.ts` (new)
- `apps/mobile/src/shared/store/watchSessionStore.ts` (new)
- `apps/mobile/src/shared/navigation/RootNavigator.tsx` (add Player screen to stack, disable swipe-back)
- `apps/web/src/features/videoPlayer/` (mirrors mobile — uses YouTube iFrame API directly for web)
- `packages/shared/src/types/watchSession.ts` (WatchSession interface)
- `packages/shared/src/utils/watchTime.ts` (`calcCompletionPercent`, `formatSeconds`)

**Dependencies:**
- Story 5 (Video Library) must be complete — player is navigated to from the library
- Story 3 (Child Profile) must be complete — `childProfileId` required for session write
- `videoStore` must expose `videos` array for auto-advance index calculation

**API Contracts (Firebase):**
```ts
// Write watch session (on pause/end/back)
addDoc(collection(db,
  'users', userId,
  'childProfiles', childProfileId,
  'watchSessions'), {
  youtubeVideoId,
  videoDurationSeconds,
  watchedSeconds,
  completionPercent: Math.round(watchedSeconds / videoDurationSeconds * 100),
  startTime,
  endTime: Timestamp.now(),   // null if app killed
  deviceType: 'android',      // or 'web'
  createdAt: serverTimestamp()
})
```

**YouTube iFrame configuration (must match exactly):**
```ts
// react-native-youtube-iframe props
<YoutubePlayer
  videoId={youtubeVideoId}
  play={isPlaying}
  onChangeState={onStateChange}
  webViewProps={{ allowsInlineMediaPlayback: true }}
  initialPlayerParams={{
    rel: 0,           // only this channel's recommendations
    modestbranding: 1, // minimal YouTube logo
    controls: 0,      // hide YouTube controls
    preventFullScreen: false
  }}
/>
```

**Compliance note:**
- `controls=0` hides YouTube's native controls — app must provide its own play/pause
- `rel=0` limits end-of-video recommendations — do NOT use `rel=1`
- YouTube videos must be unlisted on YouTube (admin responsibility) and monetisation disabled
- Player screen contains zero external links or YouTube.com navigation

---

### Complexity & Effort

**Score:** 4 (4–5 days)
**Estimated Tasks:** ~14 atomic tasks
**Risk Factors:**
- `controls=0` may not be fully respected by YouTube embed on all Android versions — test on Pixel 7 API 34 emulator
- `react-native-youtube-iframe` requires `react-native-webview` — ensure Expo Managed Workflow supports it (it does in current Expo SDK)
- 10-second polling must be implemented with `setInterval` + cleanup — memory leak risk if not cleaned up on unmount
- Divide-by-zero guard for `completionPercent` when `videoDurationSeconds` is 0
- Swipe-to-go-back disabled in React Navigation: `gestureEnabled: false` on the screen config

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- `packages/shared/src/types/watchSession.ts` — WatchSession interface
- `packages/shared/src/utils/watchTime.ts` — `calcCompletionPercent()`, `formatSeconds()`
- `apps/*/src/features/videoPlayer/hooks/useWatchSession.ts` — polling logic, session accumulation
- `apps/*/src/features/videoPlayer/services/watchSessionService.ts` — Firestore write
- `apps/*/src/shared/store/watchSessionStore.ts`

**[WEB] — Pass 1 only:**
- `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx` (HTML/CSS, standard `<iframe>`)
- `apps/web/src/features/videoPlayer/components/PlayerControls.tsx` (HTML/CSS buttons)
- YouTube iFrame API (web — standard `window.YT` player API)
- `apps/web/src/pages/WatchPage.tsx`

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/videoPlayer/components/PlayerScreen.tsx` (RN full-screen)
- `apps/mobile/src/features/videoPlayer/components/PlayerControls.tsx` (RN TouchableOpacity)
- `react-native-youtube-iframe` + `react-native-webview` (completely different from web iframe)
- `gestureEnabled: false` on React Navigation screen config (disable swipe-back)

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-7-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-7-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-7-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-7-native.md` → `completed/`
- [ ] Both passes complete → `story-7.md` → `completed/`
