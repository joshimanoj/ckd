# PRD: Story #1 — Google Sign-In & Authentication | Pass 1 — Web

Generated: 2026-03-16 | Source: story-1.md · architecture.md · Design.md v1.0
Tech stack: React 18 + Vite + TypeScript | Vitest + RTL (unit) | Firebase Local Emulator (integration) | Playwright (E2E)

---

## Track B — Functional Tests (write first, start RED)

### Functional Test FT-1: Sign In Screen Renders Correctly

**Criterion (from story-1.md):** Sign In screen renders with creator photo, app name, and "Continue with Google" button

**Test File:** `apps/web/e2e/story-1/sign-in-renders.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Navigate to `http://localhost:5173/` as an unauthenticated user
2. Assert Sign In screen is visible (not redirected)
3. Assert: circular creator photo is visible (`img[alt="Creator photo"]`, 120dp container)
4. Assert: app name text "Choti Ki Duniya" is visible with brand purple colour
5. Assert: "Continue with Google" button is visible and enabled
6. Assert: brand gradient covers the upper half of the viewport

**Assertions:**
- `[data-testid="creator-photo"]` is visible
- `[data-testid="app-name"]` has text "Choti Ki Duniya"
- `[data-testid="google-signin-btn"]` is visible and not disabled
- Background element has `linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)`
- No horizontal scrollbar at 480px viewport width

**Initial Status:** RED (implementation not yet written)

---

### Functional Test FT-2: Google Sign-In Popup Flow + Firestore User Document Created

**Criterion (from story-1.md):** Tapping "Continue with Google" triggers Google Sign-In flow; on successful sign-in, Firestore user document created at `users/{uid}` with correct fields

**Test File:** `apps/web/e2e/story-1/sign-in-flow.spec.ts`
**Framework:** Playwright + Firebase Local Emulator

**User Flow:**
1. Start Firebase Auth emulator (signed-out state)
2. Navigate to `/`
3. Click `[data-testid="google-signin-btn"]`
4. Simulate Google Sign-In completion (Firebase Auth emulator REST API: `POST /identitytoolkit.googleapis.com/v1/accounts:signInWithIdp`)
5. Assert redirect away from Sign In screen
6. Assert Firestore emulator: `GET /users/{uid}` returns document with correct fields

**Assertions:**
- After sign-in, URL is NOT `/` (routed to `/consent` on first sign-in)
- Firestore `users/{uid}` document exists
- `consentGiven === false`
- `notificationsEnabled === false`
- `fcmToken === null`
- `uid`, `email`, `displayName` are non-empty strings
- `createdAt` is a Firestore Timestamp

**Initial Status:** RED (implementation not yet written)

---

### Functional Test FT-3: First-Time User Routed to Consent Modal

**Criterion (from story-1.md):** `consentGiven` defaults to `false` on new user document creation; `onAuthStateChanged` → reads `consentGiven: false` → navigate to Consent Modal

**Test File:** `apps/web/e2e/story-1/routing-first-time.spec.ts`
**Framework:** Playwright + Firebase Local Emulator

**User Flow:**
1. Auth emulator: create user with `consentGiven: false` in Firestore
2. Sign in via emulator as that user
3. Assert app routes to `/consent` (or shows Consent Modal component)
4. Assert Sign In screen is no longer visible

**Assertions:**
- URL is `/consent` OR `[data-testid="consent-modal"]` is visible
- `[data-testid="sign-in-screen"]` is not visible

**Initial Status:** RED (implementation not yet written)

---

### Functional Test FT-4: Returning Authenticated User Bypasses Sign In

**Criterion (from story-1.md):** Returning authenticated users bypass Sign In screen and are routed based on `consentGiven` state

**Test File:** `apps/web/e2e/story-1/routing-returning-user.spec.ts`
**Framework:** Playwright + Firebase Local Emulator

**User Flow (consentGiven: true, child profile exists):**
1. Auth emulator: sign in user, set `consentGiven: true`, create child profile subcollection doc
2. Reload app at `/`
3. Assert routed to `/library` — Sign In screen never shown

**User Flow (consentGiven: true, no child profile):**
1. Auth emulator: sign in user, `consentGiven: true`, no child profile docs
2. Reload at `/`
3. Assert routed to `/profile`

**User Flow (consentGiven: false — mid-consent kill edge case):**
1. Auth emulator: user exists with `consentGiven: false`
2. Reload at `/`
3. Assert routed to `/consent`

**Assertions (per sub-flow):**
- Sub-flow 1: URL is `/library`
- Sub-flow 2: URL is `/profile`
- Sub-flow 3: URL is `/consent`
- In all cases: `[data-testid="sign-in-screen"]` never visible

**Initial Status:** RED (implementation not yet written)

---

### Functional Test FT-5: Sign-Out Clears Session and Returns to Sign In

**Criterion (from story-1.md):** Sign-out clears Firebase Auth session and returns to Sign In screen

**Test File:** `apps/web/e2e/story-1/sign-out.spec.ts`
**Framework:** Playwright + Firebase Local Emulator

**User Flow:**
1. Auth emulator: sign in user with `consentGiven: true` and child profile
2. Navigate to `/library`
3. Trigger sign-out (simulate via `window.__signOut()` test hook or navigate to settings and click sign-out — if Settings not built yet, call authService.signOutUser() directly in page.evaluate)
4. Assert URL returns to `/`
5. Assert `[data-testid="sign-in-screen"]` is visible

**Assertions:**
- URL is `/`
- `[data-testid="sign-in-screen"]` is visible
- Firebase Auth emulator: current user is null

**Initial Status:** RED (implementation not yet written)

---

### Functional Test FT-6: Responsive Rendering — Mobile Web Viewport

**Criterion (from story-1.md):** Renders correctly at 480–768px; no horizontal scroll at viewport widths < 480px

**Test File:** `apps/web/e2e/story-1/responsive.spec.ts`
**Framework:** Playwright

**User Flow (480px viewport):**
1. Set viewport to `{ width: 480, height: 844 }`
2. Navigate to `/` (unauthenticated)
3. Assert Sign In screen elements are visible and not clipped
4. Assert no horizontal scrollbar (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`)

**User Flow (375px viewport):**
1. Set viewport to `{ width: 375, height: 812 }`
2. Navigate to `/`
3. Assert no horizontal scroll (strict — no pixel overflow)

**User Flow (768px viewport):**
1. Set viewport to `{ width: 768, height: 1024 }`
2. Navigate to `/`
3. Assert Sign In screen renders correctly, no layout breakage

**Assertions:**
- At all three widths: creator photo, app name, button are visible
- `scrollWidth <= clientWidth` at 375px and 480px
- No elements overflow their containers

**Initial Status:** RED (implementation not yet written)

---

### Functional Test FT-7: Error States — Network Failure, Cancel, Offline

**Criterion (from story-1.md):** Google Sign-In network failure → inline error shown; cancel → returns cleanly; offline on launch → offline screen shown

**Test File:** `apps/web/e2e/story-1/error-states.spec.ts`
**Framework:** Playwright

**User Flow (network failure):**
1. Navigate to `/` (unauthenticated)
2. Intercept `signInWithPopup` to throw `FirebaseError` with code `auth/network-request-failed`
3. Click `[data-testid="google-signin-btn"]`
4. Assert inline error message appears below button: "Sign in failed. Please try again."
5. Assert Sign In screen is still visible (no crash, no blank screen)
6. Assert retry button or button is re-enabled

**User Flow (user cancels account picker):**
1. Intercept `signInWithPopup` to throw `FirebaseError` with code `auth/popup-closed-by-user`
2. Click `[data-testid="google-signin-btn"]`
3. Assert: no error message shown (silent return)
4. Assert: Sign In screen still visible

**User Flow (offline on launch):**
1. Set network to offline (`page.context().setOffline(true)`)
2. Navigate to `/`
3. Assert offline screen is visible: "Check your connection" message + Retry button
4. Restore network, click Retry
5. Assert Sign In screen appears

**Assertions:**
- Network failure: `[data-testid="auth-error"]` visible, text contains "Sign in failed"
- Cancel: `[data-testid="auth-error"]` NOT visible
- Offline: `[data-testid="offline-screen"]` visible, `[data-testid="sign-in-screen"]` not visible
- After retry: `[data-testid="sign-in-screen"]` visible

**Initial Status:** RED (implementation not yet written)

---

## Track A — Implementation Tasks

### Task 1 of 8: Shared User Type + Firebase Collection References

**Type:** Feature

**Files:**
- Test: `packages/shared/src/types/__tests__/user.test.ts` (type guard tests)
- Implementation: `packages/shared/src/types/user.ts`, `packages/shared/src/firebase/collections.ts`

**What to Build:**
- `User` interface matching the Firestore `users/{uid}` schema exactly
- `isUser()` type guard for runtime validation on Firestore reads
- `usersCollection(db)` — returns typed `CollectionReference<User>`
- `userDoc(db, uid)` — returns typed `DocumentReference<User>`

**Interface (authoritative — from architecture.md §3):**
```ts
export interface User {
  uid: string
  email: string
  displayName: string
  fcmToken: string | null
  notificationsEnabled: boolean  // default false
  consentGiven: boolean          // default false
  consentTimestamp: Timestamp | null
  createdAt: Timestamp
}
```

**Test Requirements:**
- Input: plain object with all fields present
- Expected: `isUser(obj)` returns `true`
- Input: object missing `consentGiven`
- Expected: `isUser(obj)` returns `false`
- Test description: "should validate User shape correctly"

**Implementation Notes:**
- Use `withConverter` pattern for Firestore typed refs (architecture.md §5 — no deviation from field names)
- Do NOT add any fields not listed above (data minimisation — compliance §9)
- `Timestamp` import from `firebase/firestore`

---

### Task 2 of 8: Firebase App Initialisation (Shared Config)

**Type:** Feature

**Files:**
- Test: `packages/shared/src/firebase/__tests__/config.test.ts`
- Implementation: `packages/shared/src/firebase/config.ts`

**What to Build:**
- Initialise Firebase app from environment variables (guard against double-init with `getApps()`)
- Export `auth` (Firebase Auth instance), `db` (Firestore instance)
- Read env vars: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`

**Test Requirements:**
- Input: mock env vars pointing to emulator config
- Expected: `auth` and `db` are non-null instances
- Expected: calling `config.ts` twice does NOT create two Firebase apps
- Test description: "should initialise Firebase once and export auth and db instances"

**Implementation Notes:**
- Use `connectAuthEmulator` and `connectFirestoreEmulator` when `VITE_USE_EMULATOR=true`
- Do NOT import Firebase Analytics SDK anywhere (compliance — architecture.md §1)
- Pattern: `getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()`

---

### Task 3 of 8: Zustand authStore

**Type:** Feature

**Files:**
- Test: `apps/web/src/shared/store/__tests__/authStore.test.ts`
- Implementation: `apps/web/src/shared/store/authStore.ts`

**What to Build:**
- Zustand store with:
  - `user: FirebaseUser | null` — current Firebase Auth user (not the Firestore User doc)
  - `loading: boolean` — true while `onAuthStateChanged` is resolving initial state
  - `setUser(user)` action
  - `setLoading(loading)` action

**Test Requirements:**
- Input: initial state
- Expected: `user === null`, `loading === true` (loading starts true — unknown state on cold start)
- Input: call `setUser(mockUser)`
- Expected: `user === mockUser`
- Input: call `setLoading(false)`
- Expected: `loading === false`
- Test description: "should initialise with null user and loading true; update correctly on setUser/setLoading"

**Implementation Notes:**
- Use Zustand `create` with no middleware (no devtools, no persist — auth state is ephemeral)
- `FirebaseUser` = `import type { User as FirebaseUser } from 'firebase/auth'`
- Keep this store minimal — Firestore user doc data (consentGiven, etc.) is read in `useAuth`, not stored here

---

### Task 4 of 8: authService — Firebase Auth + Firestore User Document

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/services/__tests__/authService.test.ts`
- Implementation: `apps/web/src/features/auth/services/authService.ts`

**What to Build:**
- `signInWithGoogle(): Promise<UserCredential>` — calls `signInWithPopup(auth, googleProvider)`
- `signOutUser(): Promise<void>` — calls `signOut(auth)`
- `createUserDoc(user: FirebaseUser): Promise<void>` — writes initial Firestore user doc (only if doc does not already exist — use `setDoc` with `merge: false`, check existence first)
- `getUserDoc(uid: string): Promise<User | null>` — reads `users/{uid}`, returns null if not found
- `subscribeToAuthState(callback: (user: FirebaseUser | null) => void): Unsubscribe` — wraps `onAuthStateChanged`

**Test Requirements (against Firebase Auth + Firestore emulator):**
- `createUserDoc`: after call, `getUserDoc(uid)` returns doc with `consentGiven: false`, `notificationsEnabled: false`, `fcmToken: null`
- `createUserDoc` called twice for same uid: does NOT overwrite existing doc (idempotent — second call is a no-op)
- `signOutUser`: after call, `auth.currentUser` is null
- Test description: "should write user doc with correct defaults and not overwrite on re-call"

**Implementation Notes:**
- `setDoc` pattern for createUserDoc: first call `getDoc` — if `doc.exists()` skip write. This prevents overwriting `consentGiven: true` if user signs out and back in.
- `serverTimestamp()` for `createdAt`
- `fcmToken: null` on creation — FCM token is populated by Story #9
- Do NOT set `consentTimestamp` to anything other than `null` here

---

### Task 5 of 8: useAuth Hook — Auth State Listener + Routing Logic

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/hooks/__tests__/useAuth.test.ts`
- Implementation: `apps/web/src/features/auth/hooks/useAuth.ts`

**What to Build:**
- `useAuth()` hook that:
  1. Subscribes to `subscribeToAuthState` on mount (unsubscribes on unmount)
  2. On auth state change: calls `setUser`, `setLoading(false)`
  3. If user is newly authenticated: reads Firestore user doc → checks `consentGiven`
  4. Returns `{ user, loading, routeTo }` where `routeTo` is one of: `'sign-in' | 'consent' | 'profile' | 'library'`
- Routing logic:
  - No user → `'sign-in'`
  - User + `consentGiven: false` → `'consent'`
  - User + `consentGiven: true` + no child profiles → `'profile'`
  - User + `consentGiven: true` + child profile exists → `'library'`
- `checkChildProfileExists(uid: string): Promise<boolean>` — queries `users/{uid}/childProfiles`, limit 1

**Test Requirements (RTL renderHook + emulator):**
- Scenario: no user → `routeTo === 'sign-in'`
- Scenario: user with `consentGiven: false` → `routeTo === 'consent'`
- Scenario: user with `consentGiven: true`, no profiles → `routeTo === 'profile'`
- Scenario: user with `consentGiven: true`, one profile exists → `routeTo === 'library'`
- Test description: "should return correct routeTo based on auth state and Firestore user document"

**Implementation Notes:**
- Use `getDocs(query(collection(db, 'users', uid, 'childProfiles'), limit(1)))` for profile check
- `loading` starts `true` (from authStore initial state) — components should render a loading skeleton while `loading === true`
- This hook is the single source of routing truth for the auth flow — do not put routing logic in components

---

### Task 6 of 8: GoogleSignInButton Component

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/components/__tests__/GoogleSignInButton.test.tsx`
- Implementation: `apps/web/src/features/auth/components/GoogleSignInButton.tsx`

**What to Build:**
- Button component with three states: `idle | loading | error`
- Props: `onSignIn: () => Promise<void>`, `error?: string`
- Visual spec (from Design.md §6 + story-1.md Design References):
  - Background: `#F43F5E` (coral-red)
  - Height: `48px` minimum
  - Border-radius: `24px` (pill)
  - Font: Nunito SemiBold 600, white label
  - Width: `100%` with `32px` horizontal padding on container
  - Google "G" logo SVG icon (inline, standard Google branding) left of label
  - Loading state: button disabled, label changes to "Signing in…", spinner replaces icon
  - Error state: button re-enabled; error text rendered below in `#EF4444`, 13sp Nunito

**States:**
- Idle → label "Continue with Google", fully interactive
- Loading → `disabled`, label "Signing in…", aria-busy true
- Error → idle button restored + `[data-testid="auth-error"]` div below with error text

**Test Requirements:**
- Render: button visible with label "Continue with Google"
- Click: calls `onSignIn` prop
- Loading state: button is disabled when `onSignIn` is pending
- Error prop set: `[data-testid="auth-error"]` visible with correct text
- Test description: "should render button, call onSignIn on click, disable during loading, show error text"

**Implementation Notes:**
- Manage `isLoading` state internally — set true on click, false after `onSignIn` resolves or rejects
- `data-testid="google-signin-btn"` on the `<button>` element
- `data-testid="auth-error"` on the error paragraph
- No external Google Sign-In SDK UI components — this is a custom-styled button that calls `signInWithGoogle()` from authService

---

### Task 7 of 8: OnboardingPage — Sign In Screen Layout

**Type:** Feature

**Files:**
- Test: `apps/web/src/pages/__tests__/OnboardingPage.test.tsx`
- Implementation: `apps/web/src/pages/OnboardingPage.tsx`

**What to Build:**
- Full-page Sign In screen layout:
  - **Upper half:** brand gradient `linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)`, 50vh height
  - **Creator photo:** 120px circular, gold/gradient ring border (`border: 3px solid #F59E0B`, or CSS gradient border), centred, overlapping the gradient/surface boundary (`position: absolute` or negative margin to straddle)
  - **App name:** "Choti Ki Duniya", Baloo 2 ExtraBold 800, 28sp, `#9333EA`, below photo
  - **Lower half:** `#FAFAFA` surface, contains app name + button
  - **GoogleSignInButton:** full-width within container (max-width 360px, centred)
  - **Offline state:** if `navigator.onLine === false` on mount, show `[data-testid="offline-screen"]` instead: friendly message "Check your connection" + Retry button. On Retry click, reload if online.
- Wires up `signInWithGoogle` from authService to `GoogleSignInButton.onSignIn`
- On `auth/popup-closed-by-user` error: no error shown (silent)
- On `auth/network-request-failed` or other errors: pass error string to `GoogleSignInButton.error`

**Test Requirements:**
- Render: creator photo, app name, button all present (`data-testid` attributes)
- Offline: when `navigator.onLine = false`, `[data-testid="offline-screen"]` visible, button not shown
- Error handling: `signInWithGoogle` rejects with `auth/network-request-failed` → `[data-testid="auth-error"]` visible
- Error handling: rejects with `auth/popup-closed-by-user` → no error shown
- Test description: "should render sign in screen, show offline state correctly, and handle auth errors"

**Implementation Notes:**
- Creator photo: use `src/assets/creator-photo.jpg` (placeholder from `Reference Assets/channels4_profile.jpg`); add `alt="Creator photo"`, `data-testid="creator-photo"`
- `data-testid="sign-in-screen"` on the root div
- `data-testid="app-name"` on the app name heading
- Listen to `window.addEventListener('online', ...)` to reactively clear offline state on restore
- Do NOT use `useNavigate` here — routing is handled by `useAuth` in `App.tsx` / router

---

### Task 8 of 8: React Router Setup + Auth-Aware Root Component

**Type:** Feature

**Files:**
- Test: `apps/web/src/__tests__/App.test.tsx`
- Implementation: `apps/web/src/App.tsx`, `apps/web/src/router.tsx`

**What to Build:**

**`router.tsx`:**
- React Router v6 `createBrowserRouter`
- Routes:
  - `/` → `<OnboardingPage />` (shown only when unauthenticated; redirects if authed)
  - `/consent` → `<ConsentPlaceholder />` (stub — full impl in Story #2)
  - `/profile` → `<ProfilePlaceholder />` (stub — full impl in Story #3)
  - `/library` → `<LibraryPlaceholder />` (stub — full impl in Story #5)
- `<AuthGuard>` wrapper component: reads `useAuth()` → while `loading`, renders full-screen `<LoadingSpinner />`; when loaded, `routeTo` drives a `<Navigate>` to the correct route
- Unauthenticated users hitting any protected route are redirected to `/`

**`App.tsx`:**
- Renders `<RouterProvider router={router} />`
- Wraps with `<Suspense>` for lazy-loaded routes (future-proofing)

**Stubs for placeholder routes (inline, single file each — not feature folders):**
- `ConsentPlaceholder`: `<div data-testid="consent-modal">Consent (Story 2)</div>`
- `ProfilePlaceholder`: `<div data-testid="profile-screen">Child Profile (Story 3)</div>`
- `LibraryPlaceholder`: `<div data-testid="library-screen">Library (Story 5)</div>`

**Test Requirements:**
- Unauthenticated: renders `OnboardingPage` at `/`
- Loading state: renders `LoadingSpinner` while `useAuth` loading is true
- `routeTo === 'consent'`: renders `ConsentPlaceholder`
- `routeTo === 'library'`: renders `LibraryPlaceholder`
- Test description: "should route correctly based on auth state and routeTo value"

**Implementation Notes:**
- `useAuth` is called once at the `AuthGuard` level — not in every page component
- `LoadingSpinner`: full-screen centered, brand purple `#9333EA` spinner (simple CSS animation) — reuse `apps/web/src/shared/components/LoadingSpinner.tsx`
- No bottom navigation on Sign In screen (auth stack is outside the main nav shell — per Design.md §3)
- Top navigation bar is part of the main app shell (Stories #5+), not this story

---

## Integration Check

- [ ] `vitest run` — all unit tests passing
- [ ] `vitest run --reporter=verbose` — integration tests against Firebase emulator passing
- [ ] `npx playwright test e2e/story-1/` — all 7 FT tasks GREEN
- [ ] `tsc --noEmit` — zero type errors
- [ ] `eslint .` — zero lint errors
- [ ] No `console.error` in test output
- [ ] Firestore user doc written with exactly the fields specified in architecture.md §3 (no extras)
- [ ] No Firebase Analytics SDK imported anywhere in the diff
- [ ] No Crashlytics SDK imported anywhere in the diff

---

## Story Acceptance

- [ ] All 8 Track A tasks implemented
- [ ] All 7 FT tasks GREEN
- [ ] All acceptance criteria from story-1.md verified
- [ ] Ready for `/check`
