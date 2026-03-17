# Task Spec: Story #5 — Video Library Grid (Web Pass)

Generated: 2026-03-17 | Story: #5 | Pass: 1 — Web
Branch: `feature/story-5-video-library-grid-web`
Stack: React 18 + Vite + TypeScript | Vitest + RTL (unit) | Playwright (FT) | Zustand | Firestore

---

## Known Test Gaps

None — all 10 acceptance criteria are covered by Playwright FT tasks.

---

## Track B — Functional Tests (Playwright)

> All tests live in `apps/web/e2e/story-5/video-library.spec.ts`.
> All require `FIREBASE_EMULATOR_RUNNING=1` — guarded by `test.skip` (same pattern as story-4).
> Run: `FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-5/`

Shared setup pattern (used in every test):
1. `clearEmulatorData(request)`
2. `createEmulatorUser` + `seedUserDoc(consentGiven: true)` + `seedChildProfile`
3. Seed video documents via new `seedVideos()` helper in `e2e/support/emulator.ts`
4. `page.goto('/')` → `signInViaTestHelper` → assert `/library`

---

### Functional Test FT-1: Library fetches active videos ordered by publishedAt DESC

**Criterion:** Library fetches `videos` where `isActive == true`, ordered by `publishedAt DESC`

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Seed 3 active videos: v1 (publishedAt: 2026-01-01), v3 (publishedAt: 2026-03-01), v2 (publishedAt: 2026-02-01)
2. Sign in → navigate to `/library`
3. Assert grid renders 3 cards
4. Assert first card title = v3's title, last card title = v1's title (newest first)

**Assertions:**
- `data-testid="video-grid"` is visible
- `[data-testid="video-card"]` count = 3
- First card `data-testid="card-title"` text = "Test Rhyme March"
- Last card `data-testid="card-title"` text = "Test Rhyme January"

**Initial Status:** RED

---

### Functional Test FT-2: Videos cached in videoStore — no re-fetch on return visit

**Criterion:** Videos cached in `videoStore` — not re-fetched on every screen visit (only on pull-to-refresh)

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Seed 2 active videos
2. Sign in → navigate to `/library` — intercept Firestore `videos` list call, count it (call #1)
3. Navigate away to `/profile`, then back to `/library`
4. Assert no second Firestore `videos` list call was made

**Implementation note:** Use `page.route('**/documents/videos**', ...)` to count calls. On the second visit, the store is already hydrated so no new request fires.

**Assertions:**
- Firestore videos collection called exactly once across both visits
- Grid still renders with the same 2 cards on return visit

**Initial Status:** RED

---

### Functional Test FT-3: Grid renders in 2 columns with correct spacing

**Criterion:** Grid renders in 2 columns with correct spacing (8dp gutter, 16dp outer)

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Seed 4 active videos
2. Sign in → navigate to `/library` at 480px viewport width
3. Assert grid has 2-column CSS layout
4. Resize to 768px viewport, assert still 2 columns
5. Assert no horizontal scroll at 375px viewport

**Assertions:**
- `[data-testid="video-grid"]` CSS `display` = "grid" and `grid-template-columns` contains exactly 2 columns (using `page.evaluate`)
- `document.documentElement.scrollWidth <= document.documentElement.clientWidth` at 375px
- At 480px: grid renders without overflow

**Initial Status:** RED

---

### Functional Test FT-4: Each card shows thumbnail (16:9), title, category chip

**Criterion:** Each card shows thumbnail (16:9), title, category chip

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Seed 1 active video: title "Test Rhyme", category "Rhymes", thumbnailUrl "https://img.youtube.com/vi/test/0.jpg"
2. Sign in → navigate to `/library`
3. Assert the single video card shows all three elements

**Assertions:**
- `[data-testid="card-thumbnail"]` img src = seeded thumbnailUrl
- `[data-testid="card-title"]` text = "Test Rhyme"
- `[data-testid="card-category-chip"]` text = "Rhymes"

**Initial Status:** RED

---

### Functional Test FT-5: Parent icon renders top-right and triggers Parental Gate on tap

**Criterion:** Parent icon renders top-right and triggers Parental Gate on tap

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Sign in → navigate to `/library`
2. Assert parent icon button is visible in header top-right
3. Click parent icon button
4. Assert parental gate modal is visible

**Assertions:**
- `[data-testid="parent-icon-btn"]` is visible
- After click: `[data-testid="parental-gate-modal"]` is visible

**Note:** The gate modal and parent-icon-btn already exist from Story #4 — this FT verifies they remain intact after Story #5 replaces the LibraryPage internals.

**Initial Status:** RED

---

### Functional Test FT-6: Pull-to-refresh re-fetches and updates video list

**Criterion:** Pull-to-refresh re-fetches and updates video list

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Seed 2 active videos, sign in → navigate to `/library`
2. Assert 2 cards visible
3. Seed a 3rd active video directly to emulator (simulates admin adding a video)
4. Click `data-testid="refresh-btn"`
5. Assert 3 cards now visible

**Assertions:**
- Before refresh: `[data-testid="video-card"]` count = 2
- After refresh: `[data-testid="video-card"]` count = 3

**Initial Status:** RED

---

### Functional Test FT-7: Category filter hidden < 20 videos, visible at ≥ 20

**Criterion:** Category filter row hidden when `videoCount < 20`, visible at ≥ 20

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow (part A — hidden):**
1. Seed 19 active videos (mixed categories)
2. Sign in → navigate to `/library`
3. Assert `[data-testid="category-filter"]` is not visible (CSS `display: none` or not in DOM)

**User Flow (part B — visible):**
1. Add 1 more active video (total 20), click `data-testid="refresh-btn"`
2. Assert `[data-testid="category-filter"]` is now visible

**Assertions:**
- 19 videos: `page.locator('[data-testid="category-filter"]').isHidden()` = true
- 20 videos (after refresh): `page.locator('[data-testid="category-filter"]').isVisible()` = true

**Initial Status:** RED

---

### Functional Test FT-8: Tapping a card navigates to /watch/:videoId

**Criterion:** Tapping a card navigates to Video Player with correct `videoId`

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Seed 1 active video with known `videoId` = "test-video-abc"
2. Sign in → navigate to `/library`
3. Click the video card
4. Assert URL is `/watch/test-video-abc`

**Assertions:**
- After click: `page.url()` ends with `/watch/test-video-abc`

**Note:** `/watch/:videoId` route is a stub page (renders `data-testid="watch-page"`) — full implementation is Story #7. Task A-12 creates this stub.

**Initial Status:** RED

---

### Functional Test FT-9: Empty state when 0 active videos

**Criterion:** Empty state displays when Firestore returns 0 active videos

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Seed 0 videos (or only `isActive: false` videos)
2. Sign in → navigate to `/library`
3. Assert empty state is visible
4. Assert "Videos coming soon!" text is present
5. Assert video grid is NOT rendered

**Assertions:**
- `[data-testid="empty-state"]` is visible
- `[data-testid="empty-state"]` contains text "Videos coming soon!"
- `[data-testid="video-grid"]` is not visible

**Initial Status:** RED

---

### Functional Test FT-10: Skeleton shimmer shown while initial fetch is in progress

**Criterion:** Skeleton shimmer shown while initial fetch is in progress

**Test File:** `e2e/story-5/video-library.spec.ts`

**User Flow:**
1. Intercept Firestore `videos` collection request and delay response by 600ms
2. Sign in → navigate to `/library`
3. While request is delayed: assert `[data-testid="skeleton-grid"]` is visible
4. After request fulfills: assert `[data-testid="skeleton-grid"]` is gone, `[data-testid="video-grid"]` is visible

**Implementation:** Use `page.route('**/documents/videos**', async route => { await new Promise(r => setTimeout(r, 600)); await route.continue() })` before navigation.

**Assertions:**
- During delay: `[data-testid="skeleton-grid"]` visible
- After fetch: `[data-testid="video-grid"]` visible, `[data-testid="skeleton-grid"]` not visible

**Initial Status:** RED

---

## Track A — Implementation Tasks

---

### Task 1 of 12: Infra — video test factory + seedVideos() emulator helper

**Type:** Feature (test infrastructure)

**Files:**
- Test: n/a (this task IS the test infrastructure)
- Implementation:
  - `apps/web/src/test/factories/video.ts` (new)
  - `apps/web/e2e/support/emulator.ts` (modify — add `seedVideo`, `seedVideos`)

**What to Build:**

`apps/web/src/test/factories/video.ts`:
```ts
import type { Video } from '@ckd/shared/types/video'
// makeVideo() factory with sensible defaults, all fields overridable
export const makeVideo = (overrides?: Partial<Video>): Video => ({
  videoId: 'test-video-1',
  youtubeVideoId: 'dQw4w9WgXcQ',
  title: 'Test Rhyme',
  category: 'Rhymes',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
  durationSeconds: 180,
  publishedAt: { seconds: 1735689600, nanoseconds: 0 } as any,
  isActive: true,
  order: 1,
  ...overrides,
})
```

Add to `e2e/support/emulator.ts`:
```ts
export async function seedVideo(request, videoId: string, overrides?: Record<string, unknown>)
export async function seedVideos(request, videos: Array<{id: string, title: string, category: string, publishedAt: string, isActive: boolean, order: number}>)
```

`seedVideo` uses PATCH to Firestore REST API to create a document at `videos/{videoId}` with all required fields as Firestore value types.

**Test Requirements:**
- No unit test for this task — it is infrastructure
- Verified implicitly when FT tasks run

**Implementation Notes:**
- Firestore REST field format: `{ stringValue: "..." }`, `{ booleanValue: true }`, `{ integerValue: "1" }`, `{ timestampValue: "2026-01-01T00:00:00Z" }`
- Use PATCH (not POST) so the videoId is predictable in FT tests
- URL: `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/videos/${videoId}`

---

### Task 2 of 12: [SHARED] Video interface + Category enum

**Type:** Feature

**Files:**
- Test: `packages/shared/src/types/__tests__/video.test.ts` (new)
- Implementation: `packages/shared/src/types/video.ts` (new)

**What to Build:**

```ts
import type { Timestamp } from 'firebase/firestore'

export type Category = 'Rhymes' | 'Colours' | 'Numbers' | 'Animals' | 'Stories'

export const CATEGORIES: Category[] = ['Rhymes', 'Colours', 'Numbers', 'Animals', 'Stories']

export interface Video {
  videoId: string
  youtubeVideoId: string
  title: string
  category: Category
  thumbnailUrl: string
  durationSeconds: number
  publishedAt: Timestamp
  isActive: boolean
  order: number
}

export function isVideo(obj: unknown): obj is Video
```

**Test Requirements:**
```
"should identify a valid Video object" → isVideo(makeVideo()) === true
"should reject object missing youtubeVideoId" → isVideo({...}) === false
"should reject object with invalid category" → isVideo({...category: 'Maths'}) === false
"CATEGORIES contains all 5 categories" → CATEGORIES.length === 5
```

**Implementation Notes:**
- Mirror the `isUser` / `isChildProfile` type guard pattern from `packages/shared/src/types/user.ts`
- Export everything from `packages/shared/src/index.ts` (create if missing)

---

### Task 3 of 12: [SHARED] videosCollection() reference

**Type:** Feature

**Files:**
- Test: `packages/shared/src/firebase/__tests__/collections.test.ts` (modify — add video collection tests)
- Implementation: `packages/shared/src/firebase/collections.ts` (modify — add videosCollection)

**What to Build:**

Add to `collections.ts`:
```ts
import type { Video } from '../types/video'

const videoConverter: FirestoreDataConverter<Video> = {
  toFirestore(video: Video) { return video },
  fromFirestore(snapshot, options): Video {
    const data = snapshot.data(options)
    return { videoId: snapshot.id, ...data } as Video
  },
}

export function videosCollection(db: Firestore): CollectionReference<Video> {
  return collection(db, 'videos').withConverter(videoConverter)
}
```

**Test Requirements:**
```
"videosCollection returns a CollectionReference at path 'videos'"
  → ref.path === 'videos'
"videoConverter.fromFirestore injects snapshot.id as videoId"
  → fromFirestore({id: 'abc', data: () => ({...})} ) gives { videoId: 'abc', ... }
```

**Implementation Notes:**
- `fromFirestore` must inject `snapshot.id` as `videoId` (same pattern as `childProfileConverter` injects `id`)
- `toFirestore` omits `videoId` from the written data (same as `childProfileConverter` omits `id`)

---

### Task 4 of 12: [SHARED] videoStore (Zustand)

**Type:** Feature

**Files:**
- Test: `apps/web/src/shared/store/__tests__/videoStore.test.ts` (new)
- Implementation: `apps/web/src/shared/store/videoStore.ts` (new)

**What to Build:**

```ts
interface VideoState {
  videos: Video[]
  loading: boolean
  error: string | null
  hydrated: boolean   // true once first successful fetch completes
  setVideos: (videos: Video[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHydrated: (hydrated: boolean) => void
  reset: () => void
}

export const useVideoStore = create<VideoState>()(...)
```

**Test Requirements:**
```
"initial state: videos=[], loading=false, error=null, hydrated=false"
"setVideos updates videos array"
"setLoading toggles loading flag"
"setError sets error string"
"setHydrated transitions hydrated from false to true"
"reset restores initial state"
```

**Implementation Notes:**
- Follow the `authStore` / `childProfileStore` pattern already in `apps/web/src/shared/store/`
- No persistence (no `persist` middleware) — in-memory only per session

---

### Task 5 of 12: [SHARED] videoService — fetchActiveVideos + fetchVideosByCategory

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoLibrary/services/__tests__/videoService.test.ts` (new)
- Implementation: `apps/web/src/features/videoLibrary/services/videoService.ts` (new)

**What to Build:**

```ts
import { getDocs, query, where, orderBy } from 'firebase/firestore'
import { videosCollection } from '@ckd/shared/firebase/collections'
import type { Video, Category } from '@ckd/shared/types/video'

export async function fetchActiveVideos(db: Firestore): Promise<Video[]>
// query: where('isActive','==',true), orderBy('publishedAt','desc')

export async function fetchVideosByCategory(db: Firestore, category: Category): Promise<Video[]>
// query: where('isActive','==',true), where('category','==',category), orderBy('order','asc')
```

**Test Requirements:**
- Use Vitest + mock Firestore (vi.mock firebase/firestore)
```
"fetchActiveVideos calls getDocs with isActive==true + publishedAt desc query"
"fetchActiveVideos returns mapped Video array from snapshot"
"fetchActiveVideos returns [] when snapshot is empty"
"fetchVideosByCategory calls getDocs with category filter + order asc"
"fetchVideosByCategory returns mapped Video array"
```

**Edge cases:**
- `getDocs` throws → let it propagate (caller handles error)

**Implementation Notes:**
- Mock pattern: `vi.mock('firebase/firestore', () => ({ getDocs: vi.fn(), query: vi.fn(), ... }))`

---

### Task 6 of 12: [SHARED] useVideoLibrary hook

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoLibrary/hooks/__tests__/useVideoLibrary.test.ts` (new)
- Implementation: `apps/web/src/features/videoLibrary/hooks/useVideoLibrary.ts` (new)

**What to Build:**

```ts
interface UseVideoLibraryReturn {
  videos: Video[]          // filtered by selectedCategory (or all if null)
  allVideos: Video[]       // unfiltered total (used for videoCount threshold)
  loading: boolean
  error: string | null
  selectedCategory: Category | null
  selectCategory: (category: Category | null) => void
  refresh: () => Promise<void>   // re-fetches regardless of hydrated state
}

export function useVideoLibrary(db: Firestore): UseVideoLibraryReturn
```

**Behavior:**
- On mount: if `videoStore.hydrated === false` → call `fetchActiveVideos`, set videos + hydrated
- On mount: if `videoStore.hydrated === true` → skip fetch (use cached videos)
- `refresh()`: always calls `fetchActiveVideos`, updates store, resets selectedCategory to null
- `selectCategory(cat)`: if cat is non-null, filters `allVideos` by category; if null, shows all
- `error`: set on fetch failure; cleared on next successful fetch

**Test Requirements:**
```
"fetches on mount when store is not hydrated — calls fetchActiveVideos once"
"does NOT fetch on mount when store is already hydrated"
"refresh() calls fetchActiveVideos even when hydrated"
"selectCategory(cat) filters videos to matching category only"
"selectCategory(null) returns all videos"
"videos array reflects filtered result; allVideos always unfiltered"
"loading is true during fetch, false after"
"error is set when fetchActiveVideos throws"
"error is cleared on next successful fetch"
```

**Implementation Notes:**
- `vi.mock` the videoService and use `useVideoStore.setState()` to set up store state in tests
- `refresh` must set `loading: true` before fetch, `loading: false` after

---

### Task 7 of 12: [WEB] VideoCard component

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoLibrary/components/__tests__/VideoCard.test.tsx` (new)
- Implementation: `apps/web/src/features/videoLibrary/components/VideoCard.tsx` (new)

**What to Build:**

```tsx
interface VideoCardProps {
  video: Video
  onClick: (videoId: string) => void
}
export function VideoCard({ video, onClick }: VideoCardProps)
```

**Visual spec:**
- Root: `data-testid="video-card"`, `background: #FAFAFA`, `border-radius: 16px`, `box-shadow: 0 4px 4px rgba(147,51,234,0.12)`, cursor pointer
- Thumbnail wrapper: padding-top 56.25% (16:9), position relative, border-radius 16px, overflow hidden
  - `<img data-testid="card-thumbnail" src={video.thumbnailUrl} alt={video.title} loading="lazy" />`
  - On img error: replace src with empty, show grey placeholder div (no broken icon)
  - Category chip overlay (bottom-left of thumbnail): `data-testid="card-category-chip"`, `background: #F3E8FF`, `color: #9333EA`, `border-radius: 20px`, `font: 13sp Nunito SemiBold`
- Title: `data-testid="card-title"`, `font: 15sp Baloo 2 SemiBold`, `color: #1E1B4B`, 2-line truncation (overflow hidden, -webkit-line-clamp 2)
- Tap animation: `transform: scale(0.95)` on active state (CSS `:active` or onPointerDown), 100ms transition

**Test Requirements:**
```
"renders thumbnail with correct src and alt"
"renders title text"
"renders category chip with category text"
"calls onClick with videoId when clicked"
"on img error: renders grey placeholder, no broken image icon"
"loading='lazy' attribute present on img"
```

**Implementation Notes:**
- Use inline styles only (no CSS modules or Tailwind) — consistent with existing app components
- Handle `onError` on `<img>` to swap to a grey background div

---

### Task 8 of 12: [WEB] SkeletonGrid component

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoLibrary/components/__tests__/SkeletonGrid.test.tsx` (new)
- Implementation: `apps/web/src/features/videoLibrary/components/SkeletonGrid.tsx` (new)

**What to Build:**

```tsx
interface SkeletonGridProps {
  count?: number  // default 6
}
export function SkeletonGrid({ count = 6 }: SkeletonGridProps)
```

**Visual spec:**
- Root: `data-testid="skeleton-grid"`, same grid CSS as VideoGrid (2 columns, 8px gap, 16px padding)
- Each skeleton card: `data-testid="skeleton-card"`, same aspect ratio wrapper as VideoCard
- Shimmer animation: CSS `@keyframes shimmer` — background gradient sweeping left-to-right
  - `background: linear-gradient(90deg, #F3E8FF 25%, #E9D5FF 50%, #F3E8FF 75%)`
  - `background-size: 200% 100%`
  - `animation: shimmer 1.4s infinite linear`
- Inject `<style>` tag for animation or use inline `@keyframes` via a `<style>` tag in component

**Test Requirements:**
```
"renders data-testid='skeleton-grid'"
"renders 6 skeleton cards by default"
"renders N skeleton cards when count=N"
"each skeleton card has data-testid='skeleton-card'"
```

**Implementation Notes:**
- Inject animation style via a `<style>` element rendered inside the component (avoids needing a CSS file)
- Keep it simple — no external animation libraries

---

### Task 9 of 12: [WEB] CategoryFilter component

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoLibrary/components/__tests__/CategoryFilter.test.tsx` (new)
- Implementation: `apps/web/src/features/videoLibrary/components/CategoryFilter.tsx` (new)

**What to Build:**

```tsx
interface CategoryFilterProps {
  categories: Category[]
  selected: Category | null
  onSelect: (category: Category | null) => void
  visible: boolean
}
export function CategoryFilter({ categories, selected, onSelect, visible }: CategoryFilterProps)
```

**Visual spec:**
- Root: `data-testid="category-filter"`, `display: visible ? 'flex' : 'none'`
- Horizontal scroll container: `overflowX: 'auto'`, `display: 'flex'`, `gap: 8`, `padding: '8px 16px'`, no scrollbar visible
- "All" chip (first): always present, selected when `selected === null`
- Category chips: one per item in `categories`
- Chip style selected: `background: #9333EA`, `color: white`
- Chip style unselected: `background: #F3E8FF`, `color: #9333EA`
- Chip: `border-radius: 20px`, `padding: 6px 16px`, `font: 13sp Nunito SemiBold`, `border: none`, `cursor: pointer`
- Each chip: `data-testid="category-chip-{category}"` (e.g. `category-chip-All`, `category-chip-Rhymes`)

**Test Requirements:**
```
"does not render (display:none) when visible=false"
"renders when visible=true"
"renders 'All' chip + one chip per category"
"'All' chip selected when selected=null"
"selected chip has purple background"
"clicking a category chip calls onSelect with that category"
"clicking 'All' chip calls onSelect with null"
```

**Edge cases:**
- `categories = []` → only "All" chip shown

---

### Task 10 of 12: [WEB] VideoGrid component

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/videoLibrary/components/__tests__/VideoGrid.test.tsx` (new)
- Implementation: `apps/web/src/features/videoLibrary/components/VideoGrid.tsx` (new)

**What to Build:**

```tsx
interface VideoGridProps {
  videos: Video[]
  allVideos: Video[]          // for videoCount threshold
  loading: boolean
  error: string | null
  onVideoTap: (videoId: string) => void
  selectedCategory: Category | null
  onCategorySelect: (category: Category | null) => void
  onRefresh: () => void
}
export function VideoGrid({ ... }: VideoGridProps)
```

**Behavior:**
- `loading === true` → render `<SkeletonGrid />`
- `error !== null` → render offline/error state: `data-testid="error-state"`, illustrated message "Check your internet connection", `data-testid="retry-btn"` calls `onRefresh`
- `loading === false && error === null && videos.length === 0` → render `<EmptyState />` (`data-testid="empty-state"`)
- `loading === false && videos.length > 0` → render:
  - `<CategoryFilter visible={allVideos.length >= 20} ...>`
  - Grid container: `data-testid="video-grid"`, CSS `display: grid`, `grid-template-columns: repeat(2, 1fr)`, `gap: 8px`, `padding: 16px`
  - `<VideoCard>` for each video, `key={video.videoId}`
- Refresh button: always visible at bottom of grid area (not in loading/error states), `data-testid="refresh-btn"`, triggers `onRefresh`

**EmptyState (inline in VideoGrid or extracted):**
- `data-testid="empty-state"`, `text: "Videos coming soon!"` (Baloo 2 Bold 20sp), subtitle "Check back soon for new rhymes." (Nunito Regular 15sp), centered

**Test Requirements:**
```
"renders SkeletonGrid when loading=true"
"renders error state when error is set"
"retry-btn click calls onRefresh"
"renders empty-state when videos=[] and not loading"
"renders video-grid with correct card count when videos present"
"renders CategoryFilter with visible=false when allVideos.length < 20"
"renders CategoryFilter with visible=true when allVideos.length >= 20"
"clicking VideoCard calls onVideoTap with videoId"
"refresh-btn always rendered when not loading and not error"
```

**Implementation Notes:**
- VideoGrid is a pure presentational component — it receives all state from parent
- All state management lives in `useVideoLibrary` hook, called by `LibraryPage`

---

### Task 11 of 12: [WEB] LibraryPage — replace placeholder, add branded header + VideoGrid

**Type:** Feature

**Files:**
- Test: `apps/web/src/pages/__tests__/LibraryPage.test.tsx` (modify — extend existing tests)
- Implementation: `apps/web/src/pages/LibraryPage.tsx` (modify)

**What to Build:**

Replace `<div data-testid="video-grid-placeholder" .../>` with full implementation:

```tsx
// Top of file: import useVideoLibrary, VideoGrid, useNavigate, db
function LibraryPage() {
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const { videos, allVideos, loading, error, selectedCategory, selectCategory, refresh } = useVideoLibrary(db)
  const navigate = useNavigate()
  const [panelVisible, setPanelVisible] = useState(false)
  const [shaking, setShaking] = useState(false)

  function handleVideoTap(videoId: string) {
    navigate(`/watch/${videoId}`)
  }

  // ...handleConfirm (existing)

  return (
    <div data-testid="library-screen" style={{minHeight:'100vh', background:'#F3E8FF', maxWidth:'100vw', overflowX:'hidden'}}>
      <header data-testid="top-nav" style={{
        background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)',
        height: 64, display:'flex', alignItems:'center', padding:'0 16px', position:'relative'
      }}>
        <img data-testid="creator-avatar" src="/src/assets/creator-photo.jpg"
          style={{width:40, height:40, borderRadius:'50%', objectFit:'cover', marginRight:12}} alt="Creator" />
        <span data-testid="app-title" style={{fontFamily:"'Baloo 2',sans-serif", fontWeight:700, fontSize:18, color:'#fff', flex:1}}>
          Choti Ki Duniya
        </span>
        <button data-testid="parent-icon-btn" onClick={showGate}
          style={{width:44, height:44, background:'transparent', border:'none', cursor:'pointer', color:'#fff', fontSize:22, borderRadius:'50%'}}>
          🔒
        </button>
      </header>

      <VideoGrid
        videos={videos}
        allVideos={allVideos}
        loading={loading}
        error={error}
        onVideoTap={handleVideoTap}
        selectedCategory={selectedCategory}
        onCategorySelect={selectCategory}
        onRefresh={refresh}
      />

      {panelVisible && <div data-testid="parent-panel">Parent Panel (Story 8)</div>}

      <ParentalGate ... />
    </div>
  )
}
```

**Test Requirements:**

Modify existing `LibraryPage.test.tsx` — all 6 existing Story #4 tests must remain GREEN. Add:

```
"renders creator-avatar and app-title in header"
"header has gradient background"
"renders VideoGrid when useVideoLibrary returns videos"
"navigates to /watch/:videoId when VideoGrid calls onVideoTap"
"passes loading=true to VideoGrid when hook is loading"
"passes error to VideoGrid when hook returns error"
```

**Implementation Notes:**
- Mock `useVideoLibrary` in the same pattern as `useParentalGate` is mocked
- The `db` import: `import { db } from '../../../packages/shared/src/firebase/config'` or via barrel — check the existing import pattern in `authService.ts`
- The existing 6 tests for parental gate interaction (`parent-icon-btn`, gate modal, etc.) must all still pass

---

### Task 12 of 12: [WEB] router.tsx — add /watch/:videoId stub route

**Type:** Feature

**Files:**
- Test: n/a (route coverage verified by FT-8)
- Implementation: `apps/web/src/router.tsx` (modify) + `apps/web/src/pages/WatchPage.tsx` (new)

**What to Build:**

`apps/web/src/pages/WatchPage.tsx`:
```tsx
import { useParams } from 'react-router-dom'
export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>()
  return (
    <div data-testid="watch-page" style={{minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <span style={{color:'#fff'}}>Video Player — Story 7 (videoId: {videoId})</span>
    </div>
  )
}
```

Add to `apps/web/src/router.tsx`:
```tsx
import { WatchPage } from './pages/WatchPage'
// Add route:
{ path: '/watch/:videoId', element: <AuthGuard><WatchPage /></AuthGuard> }
```

**Implementation Notes:**
- This is a stub — the real player is Story #7
- The stub must render `data-testid="watch-page"` so FT-8 can assert navigation
