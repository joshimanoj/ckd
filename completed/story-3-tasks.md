# Task Spec: Story #3 — Child Profile Setup | Pass 1 — Web

Generated: 2026-03-16 | Branch: feature/story-3-child-profile-web
Sources: story-3.md · architecture-dev-summary.md · Design.md v1.0
UI Context: story-3-ui-context.md | UAT: story-3-uat.md

---

## Context

`useAuth` (Story 1) already resolves routing to `'profile'` when `consentGiven: true` and no `childProfiles` exist.
`AuthGuard` already redirects to `/profile`. The `/profile` route in `router.tsx` currently renders a placeholder div.

**This story replaces that placeholder with the real `AddChildScreen` and wires the full data layer.**

No changes needed to `useAuth`, `AuthGuard`, or the routing resolution logic — they are already correct.

---

## Track B — Functional Tests (write first, start RED)

All tests live in `apps/web/e2e/story-3/`. Run with `npx playwright test e2e/story-3/`.

### FT-1: Screen renders at `/profile` when `consentGiven: true` + no profiles

**Criterion:** Screen renders automatically when `consentGiven: true` and no child profiles exist

**Test File:** `apps/web/e2e/story-3/profile-screen-renders.spec.ts`

**User Flow:**
1. Seed Firebase emulator: authenticated user, `consentGiven: true`, no `childProfiles` documents
2. Navigate to app root `/`
3. Assert: `AuthGuard` redirects to `/profile`
4. Assert: `data-testid="child-profile-screen"` is visible
5. Assert: heading "Who's watching?" is visible
6. Assert: name input is visible (`data-testid="name-input"`)
7. Assert: three age pill buttons visible ("Under 3", "3–4 years", "5–6 years")
8. Assert: "Start Watching" button visible and disabled

**Initial Status:** RED

---

### FT-2: Name whitespace-only treated as empty → button stays disabled

**Criterion:** Name input validates that a non-empty name is entered (trim whitespace) + name is only whitespace → button stays disabled

**Test File:** `apps/web/e2e/story-3/name-validation.spec.ts`

**User Flow:**
1. Seed emulator: `consentGiven: true`, no profiles → navigate to `/profile`
2. Fill name input with `"   "` (spaces only)
3. Assert: "Start Watching" button is disabled
4. Clear input, type `"Arjun"`
5. Select "3–4 years" age pill
6. Assert: "Start Watching" button is enabled
7. Clear name input
8. Assert: "Start Watching" button is disabled again

**Initial Status:** RED

---

### FT-3: Age range selector — three pills, single-select mutual exclusion

**Criterion:** Age range selector shows three options; only one selectable at a time

**Test File:** `apps/web/e2e/story-3/age-range-selector.spec.ts`

**User Flow:**
1. Navigate to `/profile`
2. Assert three pills present: "Under 3", "3–4 years", "5–6 years"
3. Click "Under 3" → assert `aria-pressed="true"` on "Under 3", false on others
4. Click "3–4 years" → assert `aria-pressed="true"` on "3–4 years", false on "Under 3"
5. Click "5–6 years" → assert `aria-pressed="true"` on "5–6 years", false on "3–4 years"

**Assertions:**
- Exactly one pill selected at a time
- Selected pill has `aria-pressed="true"` and `data-selected="true"`

**Initial Status:** RED

---

### FT-4: "Start Watching" disabled until both name + age filled

**Criterion:** "Start Watching" button disabled until both name and age range are filled

**Test File:** `apps/web/e2e/story-3/cta-disabled-state.spec.ts`

**User Flow:**
1. Navigate to `/profile` — assert button disabled
2. Fill name "Arjun" only — assert button disabled
3. Clear name, select "Under 3" only — assert button disabled
4. Fill name "Arjun" + select "Under 3" — assert button enabled (`aria-disabled="false"`, not `disabled`)

**Initial Status:** RED

---

### FT-5: Firestore document written with correct fields on confirm

**Criterion:** `childProfiles/{autoId}` document written with `name`, `dateOfBirth`, `createdAt`

**Test File:** `apps/web/e2e/story-3/firestore-write.spec.ts`

**User Flow:**
1. Seed emulator: `consentGiven: true`, no profiles
2. Navigate to `/profile`, fill name "Arjun", select "3–4 years"
3. Click "Start Watching"
4. Query emulator `users/{uid}/childProfiles` — assert exactly 1 document
5. Assert document fields:
   - `name === "Arjun"`
   - `dateOfBirth` is a Firestore Timestamp approx 3.5 years before today (±30 days tolerance)
   - `createdAt` is a Firestore Timestamp (exists and is recent)

**Initial Status:** RED

---

### FT-6: `childProfileStore` populated + navigate to `/library` after creation

**Criterion:** Active child profile set in `childProfileStore` + app navigates to Video Library

**Test File:** `apps/web/e2e/story-3/post-creation-navigation.spec.ts`

**User Flow:**
1. Navigate to `/profile`, fill "Arjun" + "5–6 years", click "Start Watching"
2. Assert: URL changes to `/library`
3. Assert: `data-testid="library-screen"` is visible

**Initial Status:** RED

---

### FT-7: Returning user (profile exists) → routes to `/library`, not `/profile`

**Criterion:** Returning users with existing profile skip this screen entirely

**Test File:** `apps/web/e2e/story-3/returning-user-routing.spec.ts`

**User Flow:**
1. Seed emulator: `consentGiven: true`, one `childProfiles` document exists
2. Navigate to app root `/`
3. Assert: redirected to `/library` (not `/profile`)
4. Assert: `data-testid="library-screen"` is visible, not `child-profile-screen`

**Initial Status:** RED

---

### FT-8: Firestore write failure → error toast shown, stays on `/profile`

**Criterion:** Firestore write fails → toast error, no navigation, user can retry

**Test File:** `apps/web/e2e/story-3/firestore-write-failure.spec.ts`

**User Flow:**
1. Navigate to `/profile`; intercept or mock Firestore write to throw
2. Fill "Arjun" + "Under 3", click "Start Watching"
3. Assert: error toast `data-testid="error-toast"` visible with text "Couldn't save profile. Try again."
4. Assert: URL is still `/profile`
5. Assert: "Start Watching" button re-enabled (user can retry)

**Implementation note:** Use Playwright `page.route()` to intercept the Firestore REST call, or inject a failing mock via a test-only hook on `window.__TEST_FAIL_PROFILE_WRITE = true`.

**Initial Status:** RED

---

## Track A — Implementation Tasks

### Task 1 of 8: `ChildProfile` interface + type guard [SHARED]

**Type:** Feature

**Files:**
- Test: `packages/shared/src/types/__tests__/user.test.ts` (extend existing)
- Implementation: `packages/shared/src/types/user.ts`

**What to Build:**

Add to `user.ts`:
```ts
export interface ChildProfile {
  id: string           // document ID (set after write, not stored in doc)
  name: string
  dateOfBirth: Timestamp
  createdAt: Timestamp
}

export function isChildProfile(obj: unknown): obj is ChildProfile {
  // validate name: string, dateOfBirth: Timestamp, createdAt: Timestamp
}
```

**Test Requirements:**
- `isChildProfile` returns `true` for valid object
- Returns `false` for missing `name`, missing `dateOfBirth`, missing `createdAt`
- Returns `false` for `name` = empty string

**Implementation Notes:**
- `id` is client-side only (populated from `snapshot.id`) — not a Firestore field
- Follow the existing `isUser` pattern in the same file

---

### Task 2 of 8: `derivedobFromAgeRange` utility [SHARED]

**Type:** Feature

**Files:**
- Test: `packages/shared/src/utils/__tests__/ageRange.test.ts` (new)
- Implementation: `packages/shared/src/utils/ageRange.ts` (new)

**What to Build:**
```ts
export type AgeRange = 'under-3' | '3-4' | '5-6'

export function dobFromAgeRange(range: AgeRange, now: Date = new Date()): Date {
  // 'under-3'  → subtract 18 months from now
  // '3-4'      → subtract 42 months (3.5 years) from now
  // '5-6'      → subtract 66 months (5.5 years) from now
}
```

**Test Requirements:**
- Input `'under-3'`, today `2026-03-16` → output `~2024-09-16` (±1 day)
- Input `'3-4'` → output `~2022-09-16` (±1 day)
- Input `'5-6'` → output `~2020-09-16` (±1 day)
- Custom `now` parameter works correctly
- Returns a `Date` object (not a string)

**Implementation Notes:**
- Use pure Date arithmetic — no date library needed
- This utility is imported by `childProfileService` and unit-tested in isolation
- Month subtraction: `new Date(y, m - months, d)` handles month/year rollover correctly

---

### Task 3 of 8: `childProfilesCollection` Firestore ref [SHARED]

**Type:** Feature

**Files:**
- Test: `packages/shared/src/firebase/__tests__/config.test.ts` (extend existing)
- Implementation: `packages/shared/src/firebase/collections.ts`

**What to Build:**

Add to `collections.ts`:
```ts
import type { ChildProfile } from '../types/user'

const childProfileConverter: FirestoreDataConverter<ChildProfile> = { ... }

export function childProfilesCollection(
  db: Firestore,
  uid: string
): CollectionReference<ChildProfile> {
  return collection(db, 'users', uid, 'childProfiles').withConverter(childProfileConverter)
}
```

**Test Requirements:**
- `childProfilesCollection(db, 'uid123')` returns a collection ref
- Collection path is `users/uid123/childProfiles`

**Implementation Notes:**
- Follow the existing `userConverter` / `usersCollection` pattern
- `fromFirestore`: spread `snapshot.data()`, add `id: snapshot.id`
- `toFirestore`: omit the `id` field (don't write it to Firestore)

---

### Task 4 of 8: `childProfileStore` Zustand store [WEB/SHARED]

**Type:** Feature

**Files:**
- Test: `apps/web/src/shared/store/__tests__/childProfileStore.test.ts` (new)
- Implementation: `apps/web/src/shared/store/childProfileStore.ts` (new)

**What to Build:**
```ts
interface ChildProfileState {
  activeProfile: ChildProfile | null
  setActiveProfile: (profile: ChildProfile | null) => void
  clearActiveProfile: () => void
}

export const useChildProfileStore = create<ChildProfileState>()(...)
```

**Test Requirements:**
- Initial state: `activeProfile` is `null`
- `setActiveProfile({ id, name, ... })` → `activeProfile` equals that object
- `clearActiveProfile()` → `activeProfile` returns to `null`

**Implementation Notes:**
- Follow `authStore.ts` pattern (Zustand `create`, no persist needed)
- No Firestore calls in the store — store is updated by the hook after service writes

---

### Task 5 of 8: `childProfileService` [WEB/SHARED]

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/childProfile/services/__tests__/childProfileService.test.ts` (new)
- Implementation: `apps/web/src/features/childProfile/services/childProfileService.ts` (new)

**What to Build:**
```ts
// Create a new child profile document
export async function createChildProfile(
  uid: string,
  name: string,
  ageRange: AgeRange
): Promise<ChildProfile>

// Fetch all child profiles for a user (returns [] if none)
export async function getChildProfiles(uid: string): Promise<ChildProfile[]>
```

**Test Requirements (run against Firebase emulator):**
- `createChildProfile('uid1', 'Arjun', '3-4')`:
  - Returns a `ChildProfile` object with `name === 'Arjun'`
  - `dateOfBirth` is ~3.5 years ago (use `dobFromAgeRange`)
  - Document exists in emulator at `users/uid1/childProfiles/{id}`
- `getChildProfiles('uid1')` after create: returns array of length 1
- `getChildProfiles('uid-no-profiles')`: returns `[]`
- `createChildProfile` with name `"  Arjun  "`: trims to `"Arjun"` before write

**Implementation Notes:**
- Use `addDoc(childProfilesCollection(db, uid), { name: name.trim(), dateOfBirth: Timestamp.fromDate(dobFromAgeRange(ageRange)), createdAt: serverTimestamp() })`
- After `addDoc`, return the full `ChildProfile` by reading the new doc with `getDoc`
- Import `db` from `@ckd/shared/firebase/config`

**Test failure hook:** Export `_setDbForTesting(testDb: Firestore)` for emulator injection (same pattern as `authService.ts`).

---

### Task 6 of 8: `useChildProfile` hook [WEB/SHARED]

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/childProfile/hooks/__tests__/useChildProfile.test.ts` (new)
- Implementation: `apps/web/src/features/childProfile/hooks/useChildProfile.ts` (new)

**What to Build:**
```ts
interface UseChildProfileResult {
  saving: boolean
  error: string | null
  saveProfile: (name: string, ageRange: AgeRange) => Promise<void>
}

export function useChildProfile(uid: string): UseChildProfileResult
```

**Behavior:**
- `saveProfile(name, ageRange)`:
  1. Sets `saving = true`, clears `error`
  2. Calls `createChildProfile(uid, name, ageRange)`
  3. Calls `setActiveProfile(profile)` on `childProfileStore`
  4. On success: sets `saving = false`, navigates to `/library` via React Router `useNavigate`
  5. On error: sets `saving = false`, sets `error = "Couldn't save profile. Try again."`

**Test Requirements:**
- Mock `createChildProfile` to resolve → `saving` goes false, `setActiveProfile` called, navigate called with `'/library'`
- Mock `createChildProfile` to reject → `saving` goes false, `error` = "Couldn't save profile. Try again.", navigate NOT called

**Implementation Notes:**
- Inject `navigate` via `useNavigate()` from `react-router-dom` inside the hook
- Use `useChildProfileStore` to call `setActiveProfile`
- Keep hook pure: no direct Firestore imports — calls service only

---

### Task 7 of 8: `AddChildScreen` component [WEB]

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/childProfile/components/__tests__/AddChildScreen.test.tsx` (new)
- Implementation: `apps/web/src/features/childProfile/components/AddChildScreen.tsx` (new)

**What to Build:**

Full-screen child profile setup form. See `story-3-ui-context.md` for exact tokens.

**Component structure:**
```
<div data-testid="child-profile-screen"> (bg: #F3E8FF)
  <TopNav /> (web nav bar — per Design.md §9)
  <header>
    creator avatar 40dp + "Who's watching?" (Baloo 2 Bold 22sp, #1E1B4B)
  </header>
  <form>
    <label>Child's name *</label>
    <input data-testid="name-input" placeholder="e.g. Arjun" ... />
    <div role="group" aria-label="Age range">
      <button data-testid="pill-under-3" aria-pressed={...} data-selected={...}>Under 3</button>
      <button data-testid="pill-3-4" ...>3–4 years</button>
      <button data-testid="pill-5-6" ...>5–6 years</button>
    </div>
    <button data-testid="start-watching-btn" disabled={!isValid} aria-disabled={!isValid}>
      Start Watching
    </button>
    {error && <div data-testid="error-toast" role="alert">{error}</div>}
  </form>
</div>
```

**Props:** none — reads `uid` from `useAuthStore`, calls `useChildProfile(uid)`

**Validation logic:**
- `isValid = name.trim().length > 0 && selectedAge !== null`
- Name trimmed to 50 chars max (silent, no error)
- Button click: if `saving` is true, no-op

**Test Requirements:**
- Renders with heading "Who's watching?"
- Name input empty → button has `disabled` attribute
- Name filled + age selected → button does NOT have `disabled` attribute
- Clicking button calls `saveProfile` with trimmed name and selected age
- Error prop shown → `data-testid="error-toast"` visible with error text
- Saving state → button shows "Saving..." and is disabled

**Implementation Notes:**
- Load `creatorPhoto` from `../../assets/creator-photo.jpg` (same asset as OnboardingPage)
- `TopNav`: reuse or inline — minimal top bar with app name; if `TopNav` doesn't exist yet, inline a simple `<nav>` with `data-testid="top-nav"` (Story 5 will refactor into shared component)
- All inline styles follow design tokens in `story-3-ui-context.md`
- Keyboard: `onSubmit` on the `<form>` so Enter key works

---

### Task 8 of 8: Wire `AddChildScreen` into router + responsive CSS [WEB]

**Type:** Feature

**Files:**
- Test: `apps/web/src/pages/__tests__/OnboardingPage.test.tsx` (add routing assertion)
- Implementation: `apps/web/src/router.tsx` + `apps/web/src/App.css`

**What to Build:**

In `router.tsx`, replace:
```tsx
// BEFORE
path: '/profile',
element: <AuthGuard><div data-testid="profile-screen">Child Profile (Story 3)</div></AuthGuard>

// AFTER
import { AddChildScreen } from './features/childProfile/components/AddChildScreen'
path: '/profile',
element: <AuthGuard><AddChildScreen /></AuthGuard>
```

Responsive CSS in `App.css`:
```css
/* Child Profile Screen */
.child-profile-screen {
  min-height: 100vh;
  background: #F3E8FF;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px 32px;
  box-sizing: border-box;
  max-width: 100vw;
  overflow-x: hidden;
}

.child-profile-form {
  width: 100%;
  max-width: 480px;
}

/* Age pill group */
.age-pill-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;  /* wraps at < 320px */
}

/* No horizontal scroll at < 480px */
@media (max-width: 480px) {
  .child-profile-screen { padding: 0 12px 24px; }
}
```

**Test Requirements:**
- Navigate to `/profile` (with authenticated + consentGiven user) → `AddChildScreen` renders, not the placeholder div
- `data-testid="profile-screen"` is GONE; `data-testid="child-profile-screen"` is present

**Implementation Notes:**
- The only change to `router.tsx` is swapping the placeholder element — no other route changes
- `data-testid="profile-screen"` (the placeholder) will be removed; update any tests that reference it

---

## Known Test Gaps

None — all 8 functional acceptance criteria have corresponding executable FT tasks. Edge cases (back navigation, name max-length trim) are covered within FT-1 and FT-2.

---

## Definition of Done

- [ ] All 8 Track A tasks complete
- [ ] All 8 Track B FTs GREEN
- [ ] `vitest run` — zero failures
- [ ] `npx playwright test e2e/story-3/` — all 8 FTs GREEN
- [ ] `tsc --noEmit` — zero errors
- [ ] `eslint .` — zero errors
- [ ] Firestore doc contains only `name`, `dateOfBirth`, `createdAt` — no extra fields
- [ ] No Firebase Analytics SDK imported in any new file
