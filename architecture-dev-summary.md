# Architecture Dev Summary: Choti Ki Duniya

Generated: 2026-03-16 | Source: architecture.md v1.0

---

## 1. Stack

| Layer | Choice |
|---|---|
| Platform | Android (React Native + Expo Managed Workflow) + Web (React + Vite) |
| Language | TypeScript — both apps and shared package |
| Mobile Framework | React Native + Expo ~51, Managed Workflow, EAS Build |
| Web Framework | React 18 + Vite ^5 |
| State Management | Zustand ^4 — four global stores (authStore, childProfileStore, videoStore, watchSessionStore) |
| Navigation (Mobile) | React Navigation v6 — Stack + Bottom Tab navigators |
| Navigation (Web) | React Router v6 |
| Backend | Firebase only — no custom server |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore |
| Push | Firebase Cloud Messaging (FCM) + @react-native-firebase/messaging + expo-notifications |
| Hosting | Firebase Hosting (web + admin panel) |
| Functions | Firebase Cloud Functions v2, Node.js 20 (FCM send trigger only) |
| Minimum Android | API 26 (Android 8.0) |
| Distribution | Expo EAS Build → signed AAB → Google Play Store |

**Monorepo layout:**
```
/
  apps/
    mobile/        ← React Native (Expo)
    web/           ← React (Vite) — includes admin panel at /admin
  packages/
    shared/        ← Types, Firebase config, watch time utilities
```

**Key third-party libraries:**
- `react-native-youtube-iframe` ^2.3 — YouTube iFrame API wrapper (mobile)
- `react-native-webview` — peer dep for youtube-iframe
- `firebase` ^10 (JS SDK) — Auth, Firestore, FCM, Hosting

**Explicitly excluded (Play Families Policy compliance):**
- NO Firebase Analytics SDK
- NO Crashlytics SDK
- NO advertising SDK
- NO third-party attribution/tracking SDK

---

## 2. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (non-component) | camelCase | `authService.ts`, `watchTime.ts` |
| Files (component) | PascalCase | `VideoCard.tsx`, `PlayerScreen.tsx` |
| Components | PascalCase | `VideoGrid`, `ConsentModal` |
| Hooks | `useFeatureName` | `useVideoLibrary`, `useWatchSession` |
| Variables / functions | camelCase | `fetchVideos`, `watchedSeconds` |
| Firestore collections | camelCase | `users`, `childProfiles`, `watchSessions`, `videos` |
| Firestore document fields | camelCase | `youtubeVideoId`, `consentTimestamp` |
| Constants | UPPER_SNAKE_CASE | `MAX_POLL_INTERVAL` |

---

## 3. File Structure

### Mobile (`apps/mobile/src/`)

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

### Web (`apps/web/src/`)

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

## 4. Test Runner Commands

| Type | Platform | Command |
|---|---|---|
| Unit | Mobile | `jest` |
| Unit | Web | `vitest run` |
| Integration | Mobile | `jest` (with Firebase Local Emulator running) |
| Integration | Web | `vitest run` (with Firebase Local Emulator running) |
| E2E | Mobile | `detox test` (Pixel 7, API 34 emulator) |
| E2E | Web | `playwright test` |
| Type check | Both | `tsc --noEmit` |
| Lint | Both | `eslint .` |
| Coverage target | Hooks + services | 70% minimum |

**Test data:** Factory functions in `tests/factories/` per app. Firebase Emulator reset between suites. YouTube iFrame API mocked in unit tests via callback injection.

**Mobile emulator target (locked):** Android Emulator — Pixel 7, API 34 (Android 14). iOS Simulator: N/A (V1 Android only).

**Firebase emulator start:** `firebase emulators:start`
