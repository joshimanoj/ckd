# Story #5: Video Library Grid | Type: UI | Pass: 1 — Web

Branch: `feature/story-5-video-library-grid-web`
Generated: 2026-03-17

---

## Track B — Functional Tests (write first, start RED)

- [x] FT-1: Library fetches active videos ordered by publishedAt DESC — `e2e/story-5/video-library.spec.ts` — 8 min
- [x] FT-2: Videos cached in videoStore — no re-fetch on return visit — `e2e/story-5/video-library.spec.ts` — 7 min
- [x] FT-3: Grid renders in 2 columns with correct spacing — `e2e/story-5/video-library.spec.ts` — 6 min
- [x] FT-4: Each card shows thumbnail, title, category chip — `e2e/story-5/video-library.spec.ts` — 6 min
- [x] FT-5: Parent icon visible and triggers Parental Gate — `e2e/story-5/video-library.spec.ts` — 5 min
- [x] FT-6: Pull-to-refresh re-fetches video list — `e2e/story-5/video-library.spec.ts` — 7 min
- [x] FT-7: Category filter hidden < 20 videos, visible at ≥ 20 — `e2e/story-5/video-library.spec.ts` — 8 min
- [x] FT-8: Tapping a card navigates to /watch/:videoId — `e2e/story-5/video-library.spec.ts` — 5 min
- [x] FT-9: Empty state when 0 active videos — `e2e/story-5/video-library.spec.ts` — 6 min
- [x] FT-10: Skeleton shimmer shown during initial fetch — `e2e/story-5/video-library.spec.ts` — 7 min

---

## Track A — Implementation Tasks

- [x] Task 1: Infra — video test factory + seedVideos() emulator helper — `apps/web/src/test/factories/video.ts` + `e2e/support/emulator.ts` — 8 min
- [x] Task 2: [SHARED] Video interface + Category enum — `packages/shared/src/types/video.ts` — 7 min
- [x] Task 3: [SHARED] videosCollection() reference — `packages/shared/src/firebase/collections.ts` — 6 min
- [x] Task 4: [SHARED] videoStore (Zustand) — `apps/web/src/shared/store/videoStore.ts` — 7 min
- [x] Task 5: [SHARED] videoService — fetchActiveVideos + fetchVideosByCategory — `apps/web/src/features/videoLibrary/services/videoService.ts` — 8 min
- [x] Task 6: [SHARED] useVideoLibrary hook — `apps/web/src/features/videoLibrary/hooks/useVideoLibrary.ts` — 10 min
- [x] Task 7: [WEB] VideoCard component — `apps/web/src/features/videoLibrary/components/VideoCard.tsx` — 9 min
- [x] Task 8: [WEB] SkeletonGrid component — `apps/web/src/features/videoLibrary/components/SkeletonGrid.tsx` — 7 min
- [x] Task 9: [WEB] CategoryFilter component — `apps/web/src/features/videoLibrary/components/CategoryFilter.tsx` — 8 min
- [x] Task 10: [WEB] VideoGrid component — `apps/web/src/features/videoLibrary/components/VideoGrid.tsx` — 10 min
- [x] Task 11: [WEB] LibraryPage — replace placeholder + add branded header — `apps/web/src/pages/LibraryPage.tsx` — 9 min
- [x] Task 12: [WEB] WatchPage stub + /watch/:videoId route — `apps/web/src/pages/WatchPage.tsx` + `apps/web/src/router.tsx` — 5 min

---

## Integration Check

- [x] Full unit test suite passing (`npm run test:unit` in `apps/web`) — 114 passed
- [x] Shared package tests passing (`npm run test:unit` in `packages/shared`)
- [ ] All 10 FT tasks GREEN (`FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-5/`) — pending emulator
- [ ] Story #4 FT suite still GREEN (regression check: `FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-4/`) — pending emulator
- [x] No TypeScript errors (`npm run check:types`)
- [x] No lint errors (`npm run lint`)
- [x] All acceptance criteria verified against story-5.md

---

## Story Acceptance

- [ ] Ready for /check
