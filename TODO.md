# Story #7: Video Player & Watch Session Tracking | Type: UI | Pass: Web

---

## Track B — Functional Tests (write FIRST, start RED)

- [ ] FT-1: Full-screen player, no bottom nav — `apps/web/e2e/story-7/player-fullscreen.spec.ts` — 6 min
- [ ] FT-2: YouTube iframe embed params (rel=0, modestbranding=1, controls=0, autoplay=1) — `apps/web/e2e/story-7/youtube-embed-params.spec.ts` — 5 min
- [ ] FT-3: Play/pause button visible, 56×56px min, toggles on click — `apps/web/e2e/story-7/player-controls.spec.ts` — 6 min
- [ ] FT-4: Back button navigates to /library, 44×44px min — `apps/web/e2e/story-7/back-to-library.spec.ts` — 5 min
- [x] FT-5: Watch session initialized on video start (Vitest integration) — `apps/web/src/features/videoPlayer/hooks/__tests__/useWatchSession.init.test.ts`
- [x] FT-6: Single Firestore write on pause/back, no duplicates (Vitest) — `apps/web/src/features/videoPlayer/services/__tests__/watchSessionService.test.ts`
- [x] FT-7: calcCompletionPercent correct + divide-by-zero guard (Vitest unit) — `packages/shared/src/utils/__tests__/watchTime.test.ts`
- [ ] FT-8: Auto-advance to next video on end; wraps to first at end of library — `apps/web/e2e/story-7/auto-advance.spec.ts` — 8 min
- [ ] FT-9: Error state visible on failure; retry reinitializes player — `apps/web/e2e/story-7/error-state.spec.ts` — 7 min
- [ ] FT-10: Responsive 480–768px, no horizontal scroll < 480px — `apps/web/e2e/story-7/responsive.spec.ts` — 6 min

---

## Track A — Implementation Tasks

- [x] Task 1: WatchSession shared type — `packages/shared/src/types/watchSession.ts`
- [x] Task 2: watchTime utilities (calcCompletionPercent, formatSeconds) — `packages/shared/src/utils/watchTime.ts`
- [x] Task 3: watchSessionStore (Zustand) — `apps/web/src/shared/store/watchSessionStore.ts`
- [x] Task 4: watchSessionService — Firestore addDoc write — `apps/web/src/features/videoPlayer/services/watchSessionService.ts`
- [x] Task 5: useWatchSession hook — session init on mount — `apps/web/src/features/videoPlayer/hooks/useWatchSession.ts`
- [x] Task 6: useWatchSession hook — 10-second polling + cleanup + flushSession — `apps/web/src/features/videoPlayer/hooks/useWatchSession.ts`
- [x] Task 7: PlayerScreen — full-screen layout + YouTube iframe + embed params — `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx`
- [x] Task 8: PlayerControls — play/pause button (56dp) — `apps/web/src/features/videoPlayer/components/PlayerControls.tsx`
- [x] Task 9: PlayerControls — back button (44×44dp) — `apps/web/src/features/videoPlayer/components/PlayerControls.tsx`
- [x] Task 10: Player loading state (black screen + white spinner) — `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx`
- [x] Task 11: Player error state (inline error + retry) — `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx`
- [x] Task 12: Auto-advance logic (videoStore index → next → wrap) — `apps/web/src/features/videoPlayer/components/PlayerScreen.tsx`
- [x] Task 13: WatchPage — wire PlayerScreen + useWatchSession + guards — `apps/web/src/pages/WatchPage.tsx`
- [x] Task 14: Responsive CSS — mobile viewport + no horizontal scroll — `apps/web/src/index.css`

---

## Integration Check

- [x] Full unit test suite passing (`npm run test:unit` in apps/web and packages/shared)
- [ ] All FT tasks GREEN (Playwright: `npx playwright test e2e/story-7/` + Vitest: `npm run test:all`)
- [ ] All acceptance criteria from story-7.md verified (functional + non-functional + edge cases)
- [x] No TypeScript errors in apps/web (`npm run check:types`)
- [x] No lint errors (`npm run lint:fix`)

## Story Acceptance

- [ ] Ready for /check
