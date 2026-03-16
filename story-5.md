# Story 5: Video Library Grid

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 2 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent or child
I want to see all available Choti Ki Duniya videos in a clear, browsable grid
So that I can quickly find and tap a video to watch

---

### Context

The Video Library is the heart of the app — the default screen after authentication. It is the first thing the child sees every time the app is opened. Every design decision here must serve two simultaneous users: the child, who browses visually by recognising thumbnail images, and the parent, who scans for new content and monitors the grid. Large thumbnails, clear titles, fast load, pull-to-refresh, and a discreet parent icon are the defining features.

The library launches with ~10 videos. Videos are fetched once from Firestore and cached in `videoStore`. Category filtering is built into the data model from day one but only made visible in the UI when the library exceeds ~20 videos — the filter UI is built here but hidden unless the category threshold is met.

---

### Problem Statement

**Current State:** Content only accessible via YouTube, which shows competitor recommendations, ads, and has no brand environment.

**Pain Points:**
- YouTube algorithm leads children to non-CKD content after video ends
- No branded, trusted viewing environment
- No way for parent to curate or control what appears in the library

**Desired State:** A full-screen grid of CKD videos. Clean, branded, no ads, no outside content. Tapping any video launches it immediately.

---

### User Flow

**Trigger:** Successful authentication + consent + child profile → Video Library is default screen.

**Steps:**
1. Library screen mounts → `useVideoLibrary` hook fetches `videos` collection from Firestore (`isActive == true`, ordered by `publishedAt DESC`)
2. While fetching: shimmer skeleton grid (2 columns, same card shape as real content)
3. On fetch success: grid renders with video cards
   - 2-column grid, 8dp gutter, 16dp outer padding
   - Each card: 16:9 thumbnail image (rounded 16dp), title below (Baloo 2 SemiBold 600 15sp), category chip overlaid bottom-left of thumbnail
4. Parent icon (circular avatar/lock, 32dp visual, 44×44dp tap target) renders in top-right of header — triggers Parental Gate (Story 4) on tap
5. App header: creator avatar (40dp), app name "Choti Ki Duniya" in Baloo 2 Bold
6. Category filter row (horizontal scrollable chips): renders but is hidden (display:none) when `videoCount < 20`; made visible automatically once threshold is crossed
7. Pull-to-refresh supported: re-fetches `videos` collection, updates `videoStore`
8. Tapping a video card → navigate to Video Player (Story 7) passing `videoId`

**Empty state (no videos in Firestore):**
- Warm illustrated empty state: creator illustration + "Videos coming soon!" (Baloo 2 Bold 20sp) + subtitle "Check back soon for new rhymes." (Nunito Regular 15sp)

**Offline state:**
- No internet → friendly full-screen error: illustrated character + "Check your internet connection" + "Try again" button (retries fetch)

**Alternatives / Error States:**
- Firestore fetch error → same offline/error state with retry
- Individual thumbnail image fails to load → show grey placeholder with video title only (no broken image icon)

---

### Acceptance Criteria

**Functional:**
- [ ] Library fetches `videos` where `isActive == true`, ordered by `publishedAt DESC`
- [ ] Videos cached in `videoStore` — not re-fetched on every screen visit (only on pull-to-refresh)
- [ ] Grid renders in 2 columns with correct spacing (8dp gutter, 16dp outer)
- [ ] Each card shows thumbnail (16:9), title, category chip
- [ ] Parent icon renders top-right and triggers Parental Gate on tap
- [ ] Pull-to-refresh re-fetches and updates video list
- [ ] Category filter row hidden when `videoCount < 20`, visible at ≥ 20
- [ ] Tapping a card navigates to Video Player with correct `videoId`
- [ ] Empty state displays when Firestore returns 0 active videos
- [ ] Skeleton shimmer shown while initial fetch is in progress

**Non-Functional:**
- [ ] Each video card has minimum 48×48dp tap target (naturally met by 2-column card width)
- [ ] Thumbnail images loaded lazily (only visible cards loaded)
- [ ] Shimmer skeleton animates (not static placeholder)
- [ ] Category chip text minimum 13sp
- [ ] Initial library load renders in < 3 seconds on Redmi Note 11 equivalent (Firestore cache hit on return visits)
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] No internet → offline state shown, retry button works on connection restore
- [ ] Thumbnail image URL broken → grey placeholder, no broken image icon
- [ ] Library has exactly 19 videos → category filter hidden; adding 20th via admin → filter auto-appears on next fetch
- [ ] Pull-to-refresh while offline → shows error toast, no crash

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 3 (IA — Video Library), 4 (Flow 2, step 1), 5 (Visual Direction), 6 (Design System), 7 (Interaction Patterns), 9 (Responsive/Adaptive Rules)

**Key UI Elements:**
- App header: gradient background `linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)`, 40dp creator circular avatar left, "Choti Ki Duniya" title Baloo 2 Bold white
- Parent icon: circular lock/avatar, 32dp, white with slight shadow, top-right header, 44×44dp tap area
- Video card: `#FAFAFA` background, 16dp border-radius, `rgba(147, 51, 234, 0.12)` shadow 4dp blur
- Thumbnail: 16:9 ratio, 16dp border-radius on all corners
- Category chip: `#F3E8FF` background, `#9333EA` text, 20dp radius, 13sp Nunito SemiBold, overlaid bottom-left of thumbnail
- Card title: 15sp Baloo 2 SemiBold, `#1E1B4B`, 2-line truncation
- Category filter chips (when visible): horizontal scrollable row, `#F3E8FF` unselected / `#9333EA` selected
- Screen background: `#F3E8FF` (child-facing context signal)

**Visual Requirements:**
- Child screen: no external links, no YouTube logo, no "More videos" or "Subscribe" CTAs
- Creator avatar in header: persistent brand presence

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/videoLibrary/components/VideoGrid.tsx` (new)
- `apps/mobile/src/features/videoLibrary/components/VideoCard.tsx` (new)
- `apps/mobile/src/features/videoLibrary/components/CategoryFilter.tsx` (new)
- `apps/mobile/src/features/videoLibrary/hooks/useVideoLibrary.ts` (new)
- `apps/mobile/src/features/videoLibrary/services/videoService.ts` (new)
- `apps/mobile/src/shared/store/videoStore.ts` (new)
- `apps/mobile/src/shared/navigation/RootNavigator.tsx` (register Library as default screen)
- `apps/web/src/features/videoLibrary/` (mirrors mobile)
- `packages/shared/src/types/video.ts` (Video interface, Category enum)

**Dependencies:**
- Story 1 (Auth) must be complete — Library is only reachable when authenticated
- Story 3 (Child Profile) must be complete — Library shows after profile is set
- Story 4 (Parental Gate) must be complete — parent icon on Library triggers gate
- Story 6 (Admin Panel) should be complete before testing with real data (library needs videos in Firestore)

**API Contracts (Firebase):**
```ts
// Fetch all active videos
getDocs(query(
  collection(db, 'videos'),
  where('isActive', '==', true),
  orderBy('publishedAt', 'desc')
))

// Category filter
getDocs(query(
  collection(db, 'videos'),
  where('isActive', '==', true),
  where('category', '==', selectedCategory),
  orderBy('order', 'asc')
))
```

**Compliance note:**
- No external links on this screen (child-facing)
- No YouTube logo or branding visible in the grid
- No "subscribe" or external CTAs

---

### Complexity & Effort

**Score:** 3 (2–3 days)
**Estimated Tasks:** ~10 atomic tasks
**Risk Factors:**
- Shimmer skeleton: use `react-native-reanimated` or `Animated` — ensure Expo Managed Workflow supports chosen approach
- Image lazy loading: `react-native` `Image` component handles this natively; ensure `resizeMode` is correct for 16:9 thumbnails
- Category filter threshold logic: `videoStore` must expose `videoCount` for the filter visibility decision

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- `packages/shared/src/types/video.ts` — Video interface, Category enum
- `packages/shared/src/firebase/collections.ts` — videos collection ref
- `apps/*/src/features/videoLibrary/hooks/useVideoLibrary.ts`
- `apps/*/src/features/videoLibrary/services/videoService.ts`
- `apps/*/src/shared/store/videoStore.ts`

**[WEB] — Pass 1 only:**
- `apps/web/src/features/videoLibrary/components/VideoGrid.tsx` (CSS grid, 2-col)
- `apps/web/src/features/videoLibrary/components/VideoCard.tsx` (HTML/CSS)
- `apps/web/src/features/videoLibrary/components/CategoryFilter.tsx` (CSS chips, horizontal scroll)
- Top navigation bar component (replaces bottom sheet trigger on web)
- Side drawer for Parent Panel (replaces bottom sheet on web)
- `apps/web/src/pages/HomePage.tsx`

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/videoLibrary/components/VideoGrid.tsx` (FlatList, 2-col)
- `apps/mobile/src/features/videoLibrary/components/VideoCard.tsx` (RN View/Image)
- `apps/mobile/src/features/videoLibrary/components/CategoryFilter.tsx` (RN ScrollView + TouchableOpacity chips)
- `RefreshControl` for pull-to-refresh (web uses browser native pull-to-refresh)
- Parent icon (top-right) + bottom sheet for Parent Panel

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-5-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-5-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-5-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-5-native.md` → `completed/`
- [ ] Both passes complete → `story-5.md` → `completed/`
