# Architecture: Choti Ki Duniya — Own Platform

Version: 1.0 | Status: Approved | Date: 2026-03-13

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0 | 2026-03-13 | Initial architecture definition | Approved |

---

## 1. Platform & Technical Stack

### Platforms

| Platform | Approach | Distribution |
|---|---|---|
| Android | React Native + Expo Managed Workflow | Google Play Store |
| Web (mobile-responsive) | React (Vite) | Firebase Hosting |
| Admin panel | React (Vite) — protected route on web app | Firebase Hosting |
| TWA / iOS | Out of scope V1 — planned V1.1 | — |

### Monorepo Structure

One repository, two apps, one shared package:

```
/
  apps/
    mobile/        ← React Native (Expo)
    web/           ← React (Vite) — includes admin panel
  packages/
    shared/        ← Types, Firebase config, watch time utilities
```

**Rationale:** Shared types and Firebase utilities prevent drift between platforms.
A full monorepo tool (Turborepo) is optional — for V1, npm workspaces is sufficient.

---

### Primary Language

**TypeScript** — both apps, shared package.

**Rationale:** Catches errors before runtime. Firestore document shapes typed via
shared interfaces. Essential for team handover and future contributors.

---

### Mobile Framework

**React Native + Expo Managed Workflow**

**Rationale:**
- Android-first, iOS-ready without code changes when iOS scope opens
- Expo Managed Workflow removes native toolchain requirement (no Android Studio
  needed for builds) — right for a small/early-stage team
- All V1 dependencies are supported in managed workflow (no ejection needed)
- Expo EAS Build produces signed AAB for Play Store submission

**Minimum Android version:** API 26 (Android 8.0 Oreo)
Covers ~97% of active Android devices in India. Devices below this are
typically 5+ years old and outside the target audience profile.

---

### Web Framework

**React 18 + Vite**

**Rationale:**
- Vite significantly faster than CRA for development iteration
- Mobile-responsive — single codebase serves all screen sizes
- Firebase Hosting serves static files via CDN — fast load times in India
- Admin panel is a protected route within the same app (no separate deployment)

---

### State Management

**Zustand** — both apps.

**Rationale:** Lightweight, zero boilerplate, no Provider wrapping required.
Redux is overkill for this app's complexity (video library, auth state, child
profile, dashboard totals). Zustand handles all four cleanly with minimal code.

Global stores:
- `authStore` — Firebase user, loading state
- `childProfileStore` — active child profile
- `videoStore` — video catalogue (fetched once, cached in memory)
- `watchSessionStore` — in-progress session state (local only, flushed to
  Firestore on pause/end)

---

### Navigation

**Mobile:** React Navigation v6 (Stack + Bottom Tab navigators)
**Web:** React Router v6

---

### Backend

**Firebase** — no custom backend server in V1.

| Service | Purpose | Compliance Status |
|---|---|---|
| Firebase Authentication | Google Sign-In | Approved — Google Play Families Policy |
| Cloud Firestore | All persistent data | Approved — Google Play Families Policy |
| Firebase Cloud Messaging | Push notifications | Approved — Google Play Families Policy |
| Firebase Hosting | Web app + admin panel | N/A (web hosting) |
| Firebase Cloud Functions | FCM send on video publish | Approved |

**Rationale:** Firebase removes the need for a backend server, reducing
operational cost and complexity to near zero at early scale. All chosen Firebase
services are on Google's approved SDK list for child-directed apps.

**Explicitly excluded:**
- Firebase Analytics — not on approved list without child-directed mode (which
  disables most features). Replaced by custom Firestore watch session logging.
- Firebase Crashlytics — not on approved list. Play Console built-in crash
  reporting used instead.
- Any advertising SDK — prohibited for child-directed apps.

---

### Build & Distribution

| Platform | Tool | Output |
|---|---|---|
| Android | Expo EAS Build | Signed AAB → Google Play Store |
| Web | Vite build | Static files → Firebase Hosting |

**Environments:** local (Firebase emulator) / staging / production
Two Firebase projects: `ckd-staging` and `ckd-production`.

---

## 2. Third-Party Dependencies

| Library / Service | Purpose | Platform | Risk if Removed |
|---|---|---|---|
| `expo` ~51 | Build toolchain, device APIs | Mobile | High — rebuild toolchain |
| `react-navigation/native` v6 | In-app navigation | Mobile | High — rewrite navigation |
| `react-native-youtube-iframe` ^2.3 | YouTube iFrame API wrapper for RN | Mobile | High — no other RN YouTube embed |
| `firebase` ^10 (JS SDK) | Auth, Firestore, FCM, Hosting | Both | High — entire backend |
| `zustand` ^4 | State management | Both | Medium — replace with Context |
| `react-router-dom` v6 | Web routing | Web | Medium — replace with alternatives |
| `vite` ^5 | Web build tool | Web | Low — replaceable with CRA |
| `react-native-webview` | Required peer dep for youtube-iframe | Mobile | High — youtube-iframe dependency |
| `@react-native-firebase/messaging` | FCM on Android (native) | Mobile | High — no push notifications |
| `expo-notifications` | Notification permissions, local display | Mobile | High — no push notifications |

---

## 3. Data Models

### Collection Structure

```
users/
  {userId}/
    childProfiles/
      {childProfileId}/
        watchSessions/
          {sessionId}

videos/
  {videoId}

notifications/           ← admin writes here to trigger FCM
  {notificationId}
```

---

### users/{userId}

**Purpose:** One document per authenticated parent.

Fields:
- `uid`: string — Firebase Auth UID (same as document ID)
- `email`: string — from Google Sign-In
- `displayName`: string — from Google Sign-In
- `fcmToken`: string | null — current device FCM token (updated on each app open)
- `notificationsEnabled`: boolean — parent's opt-in preference (default: false,
  parent must explicitly opt in — Play Store compliance)
- `consentGiven`: boolean — DPDP Act parental consent flag
- `consentTimestamp`: Timestamp — when consent was recorded (required by DPDP Act)
- `createdAt`: Timestamp

Indexes: none (document fetched by UID directly)

Security rules: `request.auth.uid == userId` — users can only read/write their
own document.

---

### users/{userId}/childProfiles/{childProfileId}

**Purpose:** One document per child added by the parent.
Watch time is tracked per child profile, not per device.

Fields:
- `childProfileId`: string — auto-generated Firestore ID
- `name`: string — child's first name
- `dateOfBirth`: Timestamp — used to display age in dashboard; not surfaced
  to child-facing screens
- `createdAt`: Timestamp

Notes:
- V1 UI supports one active child profile
- Data model supports multiple profiles from day one (V1.1 will add switcher)

Security rules: `request.auth.uid == userId`

---

### users/{userId}/childProfiles/{childProfileId}/watchSessions/{sessionId}

**Purpose:** One document per viewing session. This collection is the app's
analytics layer (replaces Firebase Analytics).

Fields:
- `sessionId`: string — auto-generated
- `youtubeVideoId`: string — YouTube video ID (e.g. `dQw4w9WgXcQ`)
- `videoDurationSeconds`: number — total length of the video
- `watchedSeconds`: number — actual seconds watched (accumulated via polling,
  NOT total elapsed time — handles pausing correctly)
- `completionPercent`: number — `watchedSeconds / videoDurationSeconds * 100`,
  rounded to integer
- `startTime`: Timestamp
- `endTime`: Timestamp | null — null if session ended unexpectedly (app killed)
- `deviceType`: `'android'` | `'web'`
- `createdAt`: Timestamp

**Write strategy:** Session data is accumulated in memory (Zustand
`watchSessionStore`) and written to Firestore in a single write on pause or
video end. Polling occurs every 10 seconds in memory only — NOT written to
Firestore on each tick. This keeps Firestore writes to ~1 per session.

**Firestore cost estimate:**
At 1,000 DAU × 5 sessions/day = 5,000 writes/day.
Firestore free tier: 20,000 writes/day. Comfortable headroom.

Indexes:
- `startTime DESC` — for dashboard queries (today / this week / this month)
- Composite: `startTime ASC` + `youtubeVideoId` — for V1.1 per-video breakdown

Security rules: `request.auth.uid == userId`

---

### videos/{videoId}

**Purpose:** The app's video catalogue. Managed by admin panel.

Fields:
- `videoId`: string — auto-generated Firestore ID
- `youtubeVideoId`: string — e.g. `dQw4w9WgXcQ` (from YouTube URL)
- `title`: string — display title
- `category`: string — enum: `Rhymes` | `Colours` | `Numbers` | `Animals` |
  `Stories` (extensible — admin can introduce new categories)
- `thumbnailUrl`: string — YouTube thumbnail URL or custom uploaded URL
- `durationSeconds`: number — video length (entered by admin at upload time)
- `publishedAt`: Timestamp — when added to the app (not YouTube upload date)
- `isActive`: boolean — soft delete / hide without removing document
- `order`: number — manual sort order within category (admin-controlled)

Indexes:
- `isActive ASC` + `publishedAt DESC` — primary library query
- `category ASC` + `isActive ASC` + `order ASC` — category-filtered view

Security rules:
- Read: any authenticated user
- Write: admin only (via Firebase custom claim `admin: true`)

---

### notifications/{notificationId}

**Purpose:** Admin writes a document here to trigger a Cloud Function that
sends FCM push to all opted-in users.

Fields:
- `title`: string — notification title (e.g. "New rhyme added!")
- `body`: string — notification body text
- `youtubeVideoId`: string | null — deep link to specific video (optional)
- `createdAt`: Timestamp
- `sentAt`: Timestamp | null — set by Cloud Function after sending
- `status`: `'pending'` | `'sent'` | `'failed'`

Security rules: write — admin only; read — admin only.

---

## 4. API Structure

No REST API. All data access is via Firebase SDK calls directly from the client.
The following documents the Firebase call patterns per feature.

---

### Authentication

```
Sign in:    signInWithPopup(auth, googleProvider)          [web]
            GoogleSignin.signIn() → signInWithCredential() [mobile]

Sign out:   signOut(auth)

On mount:   onAuthStateChanged(auth, callback)
```

On first sign-in, write user document to Firestore with `consentGiven: false`.
Consent checkpoint is shown before the user proceeds — sets `consentGiven: true`
and `consentTimestamp` on confirmation.

---

### Video Library

```
Fetch all:  getDocs(query(collection(db, 'videos'),
              where('isActive', '==', true),
              orderBy('publishedAt', 'desc')))

By category: getDocs(query(collection(db, 'videos'),
               where('isActive', '==', true),
               where('category', '==', selectedCategory),
               orderBy('order', 'asc')))
```

Videos are fetched once on app load and cached in `videoStore`. Re-fetched
on pull-to-refresh.

---

### Watch Session

```
Write session (on pause/end):
  addDoc(collection(db,
    'users', userId,
    'childProfiles', childProfileId,
    'watchSessions'), sessionPayload)
```

Session payload is assembled from Zustand `watchSessionStore` — accumulated
locally during playback, written once.

---

### Watch Time Dashboard

```
Today:      getDocs(query(collection(..., 'watchSessions'),
              where('startTime', '>=', startOfToday),
              orderBy('startTime')))

This week:  where('startTime', '>=', startOfWeek)
This month: where('startTime', '>=', startOfMonth)
```

Aggregation (sum of `watchedSeconds`) is done client-side. At V1 scale
(< 100 sessions per child per month) this is entirely appropriate.
Server-side aggregation is a V2 consideration.

---

### Push Notifications (Admin → FCM)

```
Admin writes to notifications collection
  → Cloud Function (Firestore onCreate trigger) fires
  → Queries users where notificationsEnabled == true
  → Sends FCM multicast to all fcmTokens
  → Updates notification document with sentAt + status
```

Cloud Function: Node.js 20, Firebase Functions v2, `onDocumentCreated` trigger.

---

## 5. Architecture Patterns

**Pattern:** Feature-based modules with custom hooks as the view-model layer.

Each feature owns its components, hooks (data fetching + state), and Firebase
service calls. Shared UI components live in `/shared/components`.

**Naming conventions:**
- Files: `camelCase.ts` / `PascalCase.tsx` for components
- Components: `PascalCase`
- Hooks: `useFeatureName` (e.g. `useVideoLibrary`, `useWatchSession`)
- Variables / functions: `camelCase`
- Firestore collections: `camelCase` (users, childProfiles, watchSessions, videos)
- Firestore document fields: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

---

### Mobile File Structure (`apps/mobile/src/`)

```
features/
  auth/
    components/       GoogleSignInButton.tsx, ConsentModal.tsx
    hooks/            useAuth.ts
    services/         authService.ts
  videoLibrary/
    components/       VideoGrid.tsx, VideoCard.tsx, CategoryFilter.tsx
    hooks/            useVideoLibrary.ts
    services/         videoService.ts
  videoPlayer/
    components/       PlayerScreen.tsx, PlayerControls.tsx
    hooks/            useWatchSession.ts    ← polling + session accumulation
    services/         watchSessionService.ts
  dashboard/
    components/       DashboardScreen.tsx, WatchTimeChart.tsx
    hooks/            useDashboard.ts
    services/         dashboardService.ts
  childProfile/
    components/       AddChildScreen.tsx
    hooks/            useChildProfile.ts
    services/         childProfileService.ts
  notifications/
    hooks/            useNotifications.ts  ← FCM token, opt-in
    services/         notificationService.ts
shared/
  components/         AppButton.tsx, AppText.tsx, LoadingSpinner.tsx
  hooks/              useFirestore.ts
  navigation/         RootNavigator.tsx, types.ts
  store/              authStore.ts, childProfileStore.ts,
                      videoStore.ts, watchSessionStore.ts
App.tsx
```

---

### Web File Structure (`apps/web/src/`)

```
features/
  auth/               (mirrors mobile)
  videoLibrary/       (mirrors mobile)
  videoPlayer/        (mirrors mobile)
  dashboard/          (mirrors mobile)
  childProfile/       (mirrors mobile)
  admin/
    components/       VideoForm.tsx, VideoList.tsx, NotificationPanel.tsx
    hooks/            useAdmin.ts
    services/         adminService.ts
shared/
  components/
  hooks/
  store/              (same Zustand stores, shared from packages/shared)
pages/
  HomePage.tsx
  WatchPage.tsx
  DashboardPage.tsx
  OnboardingPage.tsx
  admin/
    AdminPage.tsx     ← protected, requires admin custom claim
App.tsx
router.tsx
```

---

### Shared Package (`packages/shared/src/`)

```
types/
  user.ts             User, ChildProfile interfaces
  video.ts            Video interface + Category enum
  watchSession.ts     WatchSession interface
firebase/
  config.ts           Firebase app init (reads env vars)
  collections.ts      Typed collection references
utils/
  watchTime.ts        formatSeconds(), calcCompletionPercent()
  dateRanges.ts       startOfToday(), startOfWeek(), startOfMonth()
```

---

## 6. Infrastructure & DevOps

**Environments:**

| Environment | Firebase Project | Purpose |
|---|---|---|
| Local | Firebase Emulator Suite | Development — no real Firebase costs |
| Staging | `ckd-staging` | QA, pre-release testing |
| Production | `ckd-production` | Live users |

**Environment variables:**
Stored in `.env.local` (local), EAS secrets (mobile CI), and GitHub Secrets
(web CI). Never committed to the repository.

**CI/CD: GitHub Actions**

Two workflows:

1. `ci.yml` — runs on every PR:
   - Type check (`tsc --noEmit`)
   - Lint (`eslint`)
   - Unit tests (`vitest run` for web; `jest` for mobile)
   - Firebase emulator integration tests

2. `deploy.yml` — runs on merge to `main`:
   - Web: `vite build` → `firebase deploy --only hosting`
   - Mobile: `eas build --platform android --profile production` (manual trigger
     for Play Store submission)

**Branch strategy:** Feature branches → PR → `main`. No long-lived branches.
`main` is always deployable.

**Secret management:** `.env` files locally; GitHub Secrets for CI;
EAS Secrets for mobile builds. Firebase config keys are not secret (they are
public by design — Firestore Security Rules are the access control layer).

**Monitoring:** Play Console built-in crash reporting (Android). No third-party
crash SDK in V1.

---

## 7. Non-Functional Requirements

**Performance:**
- Android: app cold start < 3 seconds on mid-range device (e.g. Redmi Note 11)
- Web: initial load < 3 seconds on a 3G connection (India mobile average)
- Video start: YouTube embed begins playback < 2 seconds after tap (network
  dependent — not within app control, but player should be pre-initialised)
- Dashboard: watch time query resolves < 1 second (client-side aggregation,
  small data set)

**Accessibility:**
- Minimum touch target size: 48×48dp (Android guideline) — critical for
  child-operated screens
- Sufficient colour contrast on text elements (WCAG AA minimum)
- No reliance on colour alone to convey information

**Security:**
- Firestore Security Rules enforce per-user data isolation (no user can read
  another user's child profiles or watch sessions)
- Admin custom claim (`admin: true`) required to write to `videos` collection
  and `notifications` collection
- FCM tokens stored per user document — no token is shared with third parties
- No advertising ID collected anywhere in the app
- All Firebase config accessed via environment variables

**Offline:** Not supported. App requires active internet connection.
A graceful offline state (friendly error screen, not a crash) is required.

**Internationalisation:** English only in V1. String externalisation not
required but avoid hardcoding strings in deeply nested components — keep
them in a local constants file per feature for future i18n readiness.

**OS targets:**
- Android: API 26+ (Android 8.0+)
- Web: Chrome 90+, Samsung Internet 14+ (dominant browsers in India on Android)

---

## 8. Testing Strategy

**Mobile (React Native):**
- Unit: Jest + React Native Testing Library
- Integration: Jest + Firebase Local Emulator
- E2E: Detox

**Web (React):**
- Unit: Vitest + React Testing Library
- Integration: Vitest + Firebase Local Emulator
- E2E: Playwright

**Coverage target:** 70% unit test coverage minimum on feature hooks and
service files. UI components are lower priority for unit tests — covered by E2E.

---

**Mobile targets (locked — used by /sprint, /prd, and CI):**
- Android Emulator: Pixel 7, API 34 (Android 14)
- iOS Simulator: Not applicable (Android only in V1)

---

**Test data strategy:**
- Approach: Factory functions — each test creates its own minimal data
- Location: `tests/factories/` in each app
- Isolation: Firebase Local Emulator is reset between test suites
- External services: Firebase Emulator used for all Firestore/Auth/FCM tests.
  YouTube iFrame API is mocked in unit tests (player state changes simulated
  via callback injection)

**Example factory:**
```ts
// tests/factories/video.ts
export const makeVideo = (overrides?: Partial<Video>): Video => ({
  videoId: 'test-video-1',
  youtubeVideoId: 'dQw4w9WgXcQ',
  title: 'Test Rhyme',
  category: 'Rhymes',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
  durationSeconds: 180,
  publishedAt: Timestamp.now(),
  isActive: true,
  order: 1,
  ...overrides,
})
```

---

## 9. Compliance Architecture

> This section directly implements the requirements from product_note.md Section 6.
> Every item here must be verified before Play Store submission.

**SDK audit checklist (complete before first commit):**
- [ ] Firebase Auth — approved
- [ ] Firestore — approved
- [ ] FCM (`@react-native-firebase/messaging`) — approved
- [ ] YouTube iFrame API — approved
- [ ] Zustand — no data collection, approved
- [ ] React Navigation — no data collection, approved
- [ ] Expo core — review each Expo module used against Families Policy
- [ ] NO Firebase Analytics SDK
- [ ] NO Crashlytics SDK
- [ ] NO advertising SDK
- [ ] NO third-party attribution SDK

**Consent flow (DPDP Act):**
Implemented as a mandatory modal shown after first Google Sign-In, before any
child data is collected. User cannot proceed without ticking the consent checkbox.

```
onAuthStateChanged fires → user document created with consentGiven: false
→ App checks consentGiven
→ If false: show ConsentModal (non-dismissable)
  - Lists exactly what data is collected and why
  - Unchecked checkbox: "I agree to the Privacy Policy and consent to the
    collection of my child's usage data"
  - "Continue" button disabled until checked
→ On confirm: set consentGiven: true, consentTimestamp: now()
→ Proceed to child profile setup
```

**Data minimisation (enforced at service layer):**
The following fields are the ONLY fields written to Firestore across all
collections. Any addition requires explicit review:
- users: uid, email, displayName, fcmToken, notificationsEnabled,
  consentGiven, consentTimestamp, createdAt
- childProfiles: name, dateOfBirth, createdAt
- watchSessions: youtubeVideoId, videoDurationSeconds, watchedSeconds,
  completionPercent, startTime, endTime, deviceType, createdAt

Device advertising ID: never accessed. `expo-ads-admob` and similar packages
must never be added.

**No external links from child-facing screens:**
The following screens are child-facing and must contain zero external links,
no browser navigation, and no links to YouTube.com:
- VideoGrid / Library screen
- VideoPlayer screen
Any settings or privacy policy links must only appear on the parent-facing
home screen and settings screen.

**Privacy Policy:**
Must be written and published at a public URL before Play Store submission.
The URL must be:
- Linked in the Google Play Console app listing
- Accessible from the app's Settings screen (external browser link, parent
  screen only)

**FCM opt-in:**
`notificationsEnabled` defaults to `false`. Notification permission prompt
(Android 13+) and the in-app opt-in toggle both gate FCM sends.
FCM tokens are only sent to Cloud Functions for opted-in users.

**Content rating:**
App must be rated in Play Console content rating questionnaire as appropriate
for ages 5 and under. Questionnaire must be completed before submission.

---

## 10. Open Architectural Decisions

| Decision | Options | Owner | Resolve By |
|---|---|---|---|
| TWA packaging for Play Store (V1.1) | Bubblewrap CLI vs PWA Builder | Tech Lead | Before V1.1 sprint |
| Client-side vs server-side dashboard aggregation | Client (V1) → Cloud Function aggregate (V2) | Tech Lead | Before V1.1 when data volume warrants |
| Thumbnail storage | YouTube default thumbnail URL vs custom uploaded image | Admin workflow decision | Week 1 |

---

> **Cascade instruction for /sprint and /prd:**
> - Section 8 testing targets (Pixel 7, API 34) are locked. Do not re-ask.
> - Section 9 compliance checklist items must appear as explicit sprint stories
>   (SDK audit, consent flow, privacy policy link) — not assumptions.
> - Section 3 data models are authoritative. /dev must not deviate from field
>   names or collection paths without updating this document.
> - Section 4 write strategy (1 Firestore write per session, not per polling tick)
>   must be enforced in implementation.
