# Story 1: Google Sign-In & Authentication

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 1 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent
I want to sign in with my Google account in a single tap
So that I can access the app immediately without creating a new password or account

---

### Context

The app targets Indian mothers aged 25–35 who are smartphone-native but time-poor. Every extra step in onboarding is a drop-off point. Firebase Authentication with Google Sign-In eliminates the registration funnel entirely — one tap, Google account selected, inside the app. Returning users are auto-authenticated on every subsequent open.

This story covers the full authentication lifecycle: first-time sign-in, auto sign-in on return, and sign-out. It also creates the Firestore user document on first sign-in with `consentGiven: false`, which gates the DPDP consent flow (Story 2).

---

### Problem Statement

**Current State:** Parents who want a dedicated Choti Ki Duniya app would need to create an account with email and password — a known drop-off point for non-technical users.

**Pain Points:**
- Forgotten passwords → locked out of app
- Email verification flows → friction before first use
- Creating a new credential for a single app → low motivation

**Desired State:** Parent opens app → taps "Continue with Google" → selects existing Google account → inside the app in under 60 seconds with no new credentials created.

---

### User Flow

**Trigger:** Parent opens the app for the first time (or after sign-out).

**Steps:**
1. App loads → checks `onAuthStateChanged` → no authenticated user → shows Sign In screen
2. Sign In screen renders: large circular creator photo (120dp, gold ring border), app name in Baloo 2 ExtraBold, "Continue with Google" button (coral-red `#F43F5E`, pill shape, 48dp height minimum)
3. Parent taps "Continue with Google"
   - Mobile: `GoogleSignin.signIn()` → `signInWithCredential()` → Firebase Auth session created
   - Web: `signInWithPopup(auth, googleProvider)` → Firebase Auth session created
4. On first sign-in: write user document to `users/{uid}` with `consentGiven: false`, `notificationsEnabled: false`, `createdAt: now()`
5. `onAuthStateChanged` fires → app reads `consentGiven` → `false` → navigate to Consent Modal (Story 2)

**Return visit flow:**
1. App loads → `onAuthStateChanged` fires → user already authenticated → read `consentGiven`
2. If `consentGiven: true` → check if child profile exists → if yes → navigate to Video Library; if no → navigate to Child Profile Setup
3. If `consentGiven: false` (edge case: user killed app mid-consent) → navigate to Consent Modal

**Sign-out flow:**
1. Parent accesses Settings → taps "Sign Out" → `signOut(auth)` called → `onAuthStateChanged` fires → navigate to Sign In screen

**Alternatives / Error States:**
- Google Sign-In fails (network issue, account selection cancelled): Show inline error below button: "Sign in failed. Please try again." Retry button visible. No crash, no blank screen.
- User cancels Google account selection sheet: Return to Sign In screen silently (no error message needed).
- No internet connection on launch: Show friendly offline screen with "Check your connection" + Retry button before showing Sign In.

---

### Acceptance Criteria

**Functional:**
- [ ] Sign In screen renders with creator photo, app name, and "Continue with Google" button
- [ ] Tapping "Continue with Google" triggers Google Sign-In flow (native sheet on mobile, popup on web)
- [ ] On successful sign-in, Firestore user document created at `users/{uid}` with correct fields
- [ ] `consentGiven` defaults to `false` on new user document creation
- [ ] `notificationsEnabled` defaults to `false` on new user document creation
- [ ] Returning authenticated users bypass Sign In screen and are routed based on `consentGiven` state
- [ ] Sign-out clears Firebase Auth session and returns to Sign In screen
- [ ] Auth state persisted across app restarts (Firebase handles this natively)

**Non-Functional:**
- [ ] Sign In screen cold start renders in < 3 seconds on Redmi Note 11 equivalent
- [ ] "Continue with Google" button minimum 48×48dp touch target
- [ ] Google button label in Nunito SemiBold 600, white on coral-red background
- [ ] No advertising ID accessed at any point in the auth flow
- [ ] No Firebase Analytics events fired during auth flow
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] Google Sign-In network failure → inline error shown, no crash
- [ ] User cancels Google account picker → returns to Sign In screen cleanly
- [ ] App killed mid-consent → on relaunch, `consentGiven: false` correctly routes to Consent Modal
- [ ] Offline on launch → offline screen shown before Sign In, retry on restore

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 4 (Flow 1), 5 (Visual Direction), 6 (Design System), 7 (Interaction Patterns)

**Key UI Elements:**
- Sign In screen hero: 120dp circular creator photo with gold/gradient ring border, centred
- App name: Baloo 2 ExtraBold 800, 28sp, brand purple `#9333EA`
- "Continue with Google" button: coral-red `#F43F5E`, 48dp height, 24dp border-radius (pill), Nunito SemiBold, full-width with 32dp horizontal padding
- Background: brand gradient `linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)` on upper half, `#FAFAFA` surface below
- Error text: 13sp Nunito, `#EF4444`, inline below button

**Visual Requirements:**
- Creator photo must appear prominently — this is the primary trust signal for new parents
- No YouTube logo or branding on the Sign In screen
- Dark-mode not required in V1

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/auth/components/GoogleSignInButton.tsx` (new)
- `apps/mobile/src/features/auth/hooks/useAuth.ts` (new)
- `apps/mobile/src/features/auth/services/authService.ts` (new)
- `apps/mobile/src/shared/store/authStore.ts` (new)
- `apps/mobile/src/shared/navigation/RootNavigator.tsx` (auth state routing logic)
- `apps/web/src/features/auth/` (mirrors mobile)
- `packages/shared/src/types/user.ts` (User interface)
- `packages/shared/src/firebase/collections.ts` (users collection reference)

**Dependencies:**
- Sprint 0 must be complete (Firebase project configured, Expo project initialised)
- This story must complete before Story 2 (Consent), Story 3 (Child Profile), and all subsequent stories

**API Contracts (Firebase):**
```ts
// Sign in (mobile)
GoogleSignin.signIn() → signInWithCredential(auth, credential)

// Sign in (web)
signInWithPopup(auth, googleProvider)

// Auth state listener (both)
onAuthStateChanged(auth, callback)

// First sign-in user document write
setDoc(doc(db, 'users', uid), {
  uid,
  email,
  displayName,
  fcmToken: null,
  notificationsEnabled: false,
  consentGiven: false,
  consentTimestamp: null,
  createdAt: serverTimestamp()
})

// Sign out
signOut(auth)
```

**Data Model:**
```
users/{uid}
  uid: string
  email: string
  displayName: string
  fcmToken: string | null
  notificationsEnabled: boolean  // default false
  consentGiven: boolean          // default false
  consentTimestamp: Timestamp | null
  createdAt: Timestamp
```

**Compliance note:** Do NOT access device advertising ID at any point. Do NOT initialise Firebase Analytics SDK.

---

### Complexity & Effort

**Score:** 3 (2–3 days)
**Estimated Tasks:** ~8 atomic tasks
**Risk Factors:**
- `react-native-google-signin` package setup requires SHA certificate fingerprint for Android — must be configured in Firebase Console before testing on device/emulator
- Google Sign-In popup on web requires authorised domain registered in Firebase Console
- Expo Managed Workflow: use `@react-native-google-signin/google-signin` (Expo-compatible version)

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- `packages/shared/src/types/user.ts`
- `packages/shared/src/firebase/collections.ts`
- `apps/*/src/features/auth/hooks/useAuth.ts` (auth state, routing logic)
- `apps/*/src/features/auth/services/authService.ts` (Firestore user doc write, sign-out)
- `apps/*/src/shared/store/authStore.ts`

**[WEB] — Pass 1 only:**
- `apps/web/src/features/auth/components/GoogleSignInButton.tsx` (HTML button)
- `apps/web/src/pages/OnboardingPage.tsx`
- `signInWithPopup(auth, googleProvider)` call in authService.ts

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/auth/components/GoogleSignInButton.tsx` (RN TouchableOpacity)
- `GoogleSignin.signIn()` → `signInWithCredential()` swap in authService.ts
- SHA-1 certificate fingerprint registered in Firebase Console
- `app.json` Google Sign-In config

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-1-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-1-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-1-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-1-native.md` → `completed/`
- [ ] Both passes complete → `story-1.md` → `completed/`
