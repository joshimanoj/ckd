# Sprint Plan: Choti Ki Duniya — Own Platform

> **Terminology**
> - **Web** — React app served via Firebase Hosting. Runs in any browser. Mobile web (480–768px) is the primary target; desktop renders correctly but is not layout-optimised.
> - **Native App** — React Native + Expo. Distributed via Play Store. Separate codebase for UI components; shares all hooks, services, and Firebase calls with Web.
> - **[WEB]** — task or file belongs to the Web pass (Pass 1)
> - **[NATIVE]** — task or file belongs to the Native App pass (Pass 2)
> - **[SHARED]** — written once in Pass 1, imported by both Web and Native

Generated: 2026-03-16 | Total Stories: 10 | Duration: 9 weeks
Sources: product_note.md v1.0 · architecture.md v1.0 · Design.md v1.0

---

## Contents

1. Technical Prerequisites (Sprint 0)
2. Story Index
3. Sprint Breakdown
4. Critical Path
5. Roadmap
6. Archiving Rules

Full story detail lives in individual `story-N.md` files.
Dev reference lives in `architecture-dev-summary.md`.

**Platform target:** Mobile web is the primary web target. Desktop renders fine but is not optimised. No separate desktop stories.

---

## Active Pointers

```
Web Track  → Story #1 [Pass 1] | Ready for: /prd → outputs prd-1-web.md
Native App Track → not started (begins after Story #1 Web Done)
```

---

## 1. Technical Prerequisites (Sprint 0)

**Duration:** Week 1 (before any feature work begins)
**Blocker:** All Sprint 1 stories are blocked until Sprint 0 is complete.

### Infrastructure

- [ ] Create GitHub repository (monorepo): `gh repo create choti-ki-duniya --private --source=. --remote=origin --push`
- [ ] Set up npm workspaces: `apps/mobile`, `apps/web`, `packages/shared`
- [ ] Initialise Expo project: `npx create-expo-app apps/mobile --template` (TypeScript template)
- [ ] Initialise Vite web app: `npm create vite@latest apps/web -- --template react-ts`
- [ ] Initialise shared package: `packages/shared` with TypeScript config
- [ ] Configure `tsconfig.json` at root + per-app
- [ ] Configure ESLint + Prettier across monorepo
- [ ] Add `.gitignore` (node_modules, .env files, build outputs)

### Firebase Setup

- [ ] Create two Firebase projects: `ckd-staging` and `ckd-production`
- [ ] Enable Firebase Authentication (Google Sign-In provider) in both projects
- [ ] Enable Cloud Firestore in both projects (region: asia-south1 for India latency)
- [ ] Enable Firebase Cloud Messaging in both projects
- [ ] Enable Firebase Hosting in both projects
- [ ] Enable Firebase Cloud Functions in both projects (requires Blaze plan — confirm with founder)
- [ ] Install Firebase Local Emulator Suite (`firebase emulators:start`)
- [ ] Configure Firestore Security Rules (per architecture.md Section 3)
- [ ] Configure Firestore indexes (per architecture.md Section 3 — `startTime DESC`, category composite)
- [ ] Set Firebase custom claim `admin: true` on creator's Google account (Firebase Admin SDK CLI)
- [ ] Configure `.env.local` files for both apps (Firebase config keys)
- [ ] Add Firebase config to GitHub Secrets (for CI) and EAS Secrets (for mobile builds)

### Expo / Android Setup

- [ ] Create Expo account + EAS account
- [ ] Configure `app.json` / `app.config.ts` (app name, bundle ID: `com.chotikiduniya.app`, permissions)
- [ ] Configure EAS Build profiles (`eas.json`): development / staging / production
- [ ] Register SHA-1 certificate fingerprint in Firebase Console (Android, for Google Sign-In)
- [ ] Verify Expo managed workflow supports all required packages:
  - `react-native-youtube-iframe` + `react-native-webview`
  - `@react-native-firebase/messaging` + `expo-notifications`
  - `@react-native-google-signin/google-signin`
- [ ] Set up Android Emulator: Pixel 7, API 34 (Android 14) — locked target per architecture.md

### CI/CD

- [ ] Create `.github/workflows/ci.yml`: type-check + lint + unit tests + emulator integration tests (on PR)
- [ ] Create `.github/workflows/deploy.yml`: web deploy to Firebase Hosting on merge to `main`
- [ ] Confirm CI passes on empty project before feature work begins

### Design Assets (Required before Story 5 / Story 1 UI work)

- [ ] **App icon:** 1024×1024px PNG, brand purple `#9333EA` background, "CKD" or creator logo mark — required for Expo `app.json` and Play Store listing
- [ ] **Adaptive icon (Android):** foreground layer (108×108dp) + background layer — required for API 26+ (`android.adaptiveIcon` in `app.json`)
- [ ] **Splash screen:** 1284×2778px (or Expo splash screen config), brand gradient background + app logo
- [ ] **Creator photo asset:** hi-res circular-crop PNG of creator on transparent or brand-coloured background (120dp display size on Sign In screen; 40dp in Library header) — per Design.md Section 5
- [ ] **Notification icon:** 96×96px white silhouette on transparent background (Android FCM notification icon spec)
- [ ] **Empty state illustrations:** 2 illustrations — Video Library empty state ("Videos coming soon!") and Dashboard empty state ("No watch time yet") — on-brand, warm, creator-likeness or character
- [ ] **Sprite sheet / icon set:** UI icons required — back arrow, play, pause, lock/parent icon, bell, settings gear, chevron. Use a single consistent icon library (e.g. `@expo/vector-icons` — included in Expo, no extra asset needed) or a custom SVG sprite sheet if branded icons are required. Decision: use `@expo/vector-icons` (MaterialIcons or Ionicons) as default — custom sprite sheet only if founder requires branded icons.
- [ ] **Google Play Store listing assets:** Feature graphic (1024×500px), at least 2 screenshots (1080×1920px portrait). These can be prepared after the app is functionally complete but must be ready before Play Store submission.

### SDK Compliance Audit (Blocker — must complete before first commit)

Per architecture.md Section 9 and product_note.md Section 6:

- [ ] Firebase Auth — APPROVED ✓
- [ ] Cloud Firestore — APPROVED ✓
- [ ] FCM (`@react-native-firebase/messaging`) — APPROVED ✓
- [ ] YouTube iFrame API — APPROVED ✓
- [ ] Zustand — no data collection — APPROVED ✓
- [ ] React Navigation — no data collection — APPROVED ✓
- [ ] Expo core modules — review each module used against Families Policy approved list
- [ ] Confirm: NO Firebase Analytics SDK installed anywhere
- [ ] Confirm: NO Crashlytics SDK installed anywhere
- [ ] Confirm: NO advertising SDK installed anywhere
- [ ] Confirm: NO third-party attribution/tracking SDK installed anywhere
- [ ] Document audit results in `COMPLIANCE.md` at repo root

### Open Questions to Resolve in Sprint 0

| Question | Owner | Must Resolve By |
|---|---|---|
| Firebase Blaze plan confirmed (required for Cloud Functions)? | Founder | Start of Sprint 0 |
| Creator photo asset available (hi-res, transparent background)? | Founder | End of Sprint 0 |
| Empty state illustrations — who produces them? | Founder / Designer | End of Sprint 0 |
| Privacy Policy — who writes it and when is it live? | Founder / Legal | Before Play Store submission (Sprint 4) |
| Custom icon sprite sheet or use `@expo/vector-icons`? | Founder / Tech Lead | End of Sprint 0 |
| Watch time tracked per child profile (confirmed)? | Product | Start of Sprint 1 |
| Crashlytics excluded from V1 (confirmed)? | Tech Lead | Start of Sprint 0 |

---

## 2. Story Index

| # | Title | Feature Source | Type | Complexity | Sprint | Web Done | Native App Done |
|---|---|---|---|---|---|---|---|
| 1 | Google Sign-In & Authentication | Feature 1 | UI | 3 | 1 | ☐ | ☐ |
| 2 | DPDP Parental Consent Flow | Compliance (§6) | UI | 2 | 1 | ☐ | ☐ |
| 3 | Child Profile Setup | Feature 2 | UI | 2 | 1 | ☐ | ☐ |
| 4 | Parental Gate | Design §7 (Families Policy) | UI | 2 | 1 | ☐ | ☐ |
| 5 | Video Library Grid | Feature 3 | UI | 3 | 2 | ☐ | ☐ |
| 6 | Admin Panel — Video Management | Design Flow 5 | UI | 3 | 2 | ☐ | Web Only |
| 7 | Video Player & Watch Session Tracking | Feature 3 + 4 | UI | 4 | 2 | ☐ | ☐ |
| 8 | Watch Time Dashboard | Feature 4 | UI | 3 | 3 | ☐ | ☐ |
| 9 | Push Notifications | Feature 5 | UI | 3 | 3 | ☐ | ☐ |
| 10 | Settings Screen & Privacy Policy Link | Compliance (§6) | UI | 2 | 3 | ☐ | ☐ |

**Total complexity points:** 27
**All stories are UI stories** — `/uat` required after `/check` for every story.
**No backend-only stories** — all backend work (Cloud Functions, Firestore rules, security) is embedded within relevant UI stories.

---

## 3. Sprint Breakdown

### Sprint 0: Foundation & Setup
**Duration:** Week 1 | **Goal:** Development-ready monorepo with Firebase, CI/CD, compliance audit, and all design assets prepared
**Stories:** None — infrastructure only
**Deliverables:** Working local dev environment, SDK audit complete, `COMPLIANCE.md` written, all design assets (icon, splash, creator photo, illustrations) confirmed or in production

---

### Sprint 1: Onboarding & Access Control
**Duration:** Weeks 2–3 | **Goal:** A parent can sign in, give consent, add their child, and reach the (empty) Video Library
**Success Metric:** Full onboarding flow works end-to-end — web: sign in → consent → child profile → Library screen renders in browser; mobile: same flow on Pixel 7 API 34 emulator

**Web Track: Stories #1, #2, #3, #4 — targets Firebase Hosting deploy**
**Native App Track: not started (begins after Sprint 1 Web Done)**

| Story | Title | Complexity | Dependencies |
|---|---|---|---|
| #1 | Google Sign-In & Authentication | 3 | Sprint 0 |
| #2 | DPDP Parental Consent Flow | 2 | Story #1 |
| #3 | Child Profile Setup | 2 | Story #2 |
| #4 | Parental Gate | 2 | None (shared component — Story #5 integrates it) |

**Sprint Capacity:** 9 points
**Risks:**
- Google Sign-In setup (SHA certificate, Firebase Console config) can block Story #1 — do this on Day 1 of Sprint 1
- DPDP consent legal text must be finalised before Story #2 ships (founder/legal dependency)

**DoD:**
- [ ] All 4 stories passing /check and /uat on web
- [ ] Onboarding E2E test runs clean on web (mobile web viewport)
- [ ] Consent record written correctly to Firestore (verified in integration test)

---

### Sprint 2: Core Viewing Experience
**Duration:** Weeks 4–5 | **Goal:** A child can browse videos, tap one, and watch it full-screen. Admin can add videos. Watch time is recorded.
**Success Metric:** 10 seed videos visible in library on web; child can tap, watch, return to library; watch session written to Firestore

**Web Track: Stories #5, #6, #7 — targets Firebase Hosting deploy**
**Native App Track: Stories #1–#4 from Sprint 1 — targets EAS build accumulation**

| Story | Title | Complexity | Dependencies |
|---|---|---|---|
| #6 | Admin Panel — Video Management | 3 | Sprint 0 (admin claim set) |
| #5 | Video Library Grid | 3 | Stories #1, #3, #4 |
| #7 | Video Player & Watch Session Tracking | 4 | Stories #5, #3 |

**Sprint Capacity:** 10 points
**Sequence within sprint:** Start with #6 (admin) in parallel with #5 — seeding videos unlocks real testing of #5 and #7
**Risks:**
- Story #7 is the most complex story — allocate 4–5 days; plan buffer
- YouTube `controls=0` behaviour on Android emulator must be verified early
- Cloud Function for Story #9 (Push) can be scaffolded at end of Sprint 2 to reduce Sprint 3 risk

**DoD:**
- [ ] All 3 stories passing /check and /uat on web
- [ ] 10 seed videos in Firestore (added via admin panel)
- [ ] Watch session Firestore write verified (integration test + manual check)
- [ ] YouTube embed params (`rel=0`, `controls=0`) verified on web

---

### Sprint 3: Parent Features & Notifications
**Duration:** Weeks 6–7 | **Goal:** Parent can check watch time, opt in to notifications, and manage settings. Creator can send push notifications.
**Success Metric:** Dashboard shows correct totals after a simulated watch session; admin sends test notification received on device

**Web Track: Stories #8, #9, #10 — targets Firebase Hosting deploy**
**Native App Track: Stories #5, #6, #7 from Sprint 2 — targets EAS build accumulation**

| Story | Title | Complexity | Dependencies |
|---|---|---|---|
| #8 | Watch Time Dashboard | 3 | Stories #4, #7 |
| #9 | Push Notifications | 3 | Stories #1, #6, #7 |
| #10 | Settings Screen & Privacy Policy Link | 2 | Stories #4, #9 |

**Sprint Capacity:** 8 points
**Risks:**
- Firebase Blaze plan must be active before Cloud Function deployment (Story #9)
- FCM testing on emulator is limited — allocate time for physical device testing
- Privacy Policy URL must be provided by founder before end of Sprint 3 (Play Store submission prep)

**DoD:**
- [ ] All 3 stories passing /check and /uat on web
- [ ] End-to-end notification flow tested: admin sends → device receives (web FCM)
- [ ] Privacy Policy link live and linked in Settings screen

---

### Sprint 4: Mobile Pass + Play Store Submission
**Duration:** Weeks 8–9 | **Goal:** All stories ported to React Native + app submitted to Google Play Store internal testing track

**Native App Track: Stories #8, #9, #10 from Sprint 3 — completes all Native App Done**

**Deliverables:**
- [ ] All stories Native App Done — Native App pass complete for stories #1–#5, #7–#10
- [ ] Full E2E test suite clean on Pixel 7 API 34 emulator
- [ ] EAS production build generated (signed AAB)
- [ ] Firestore Security Rules reviewed and locked
- [ ] SDK compliance audit re-verified (no new packages added)
- [ ] Privacy Policy published at a public URL
- [ ] Google Play Console content rating questionnaire completed (PEGI 3 / children 5 and under)
- [ ] Play Store listing: description, feature graphic (1024×500), ≥ 2 screenshots
- [ ] App submitted to Internal Testing track (team review before wider rollout)
- [ ] Monitor Play Console for rejection reasons; resolve and resubmit if needed

---

## 4. Critical Path

```
Sprint 0 (setup + assets + SDK audit)
  └── Story #1 Web Done (Auth)
        └── Story #2 Web Done (Consent)
              └── Story #3 Web Done (Child Profile)
                    └── Story #5 Web Done (Library) ── Story #6 Web Done (Admin) [parallel]
                          └── Story #7 Web Done (Player + Watch Tracking)
                                ├── Story #8 Web Done (Dashboard)
                                └── Story #9 Web Done (Notifications)
                                      └── Story #10 Web Done (Settings)
                                            └── Native App Pass begins: #1 → #2 → #3 → ... → #10
```

**Hard blocking dependencies:**
- Story #1 blocks Stories #2, #3 — auth must exist for all subsequent user flows
- Story #2 blocks Story #3 — consent must be recorded before child data is written
- Story #3 blocks Story #7 — `childProfileId` required for watch session writes
- Story #5 blocks Story #7 — player is navigated from library; `videoStore` required for auto-advance
- Story #7 blocks Story #8 — dashboard reads `watchSessions` written by player
- Story #9 blocks Story #10 — settings notification toggle uses `useNotifications` hook

**Parallel-safe:**
- Story #4 (Parental Gate) — buildable in parallel with Sprint 0 or early Sprint 1; integrated into Story #5
- Story #6 (Admin Panel) — buildable in parallel with Story #5 in Sprint 2 (web-only story, no mobile dependency)
- Stories #8, #9, #10 — can be developed in parallel within Sprint 3 (all depend on Sprint 2 completion but not each other)
- Native App passes for Sprint 1 stories (#1–#4) — can begin as soon as their respective Web Done is confirmed

**De-risking actions:**
- Google Sign-In SHA certificate: configure on Day 1 of Sprint 1 (unblocks Story #1 device testing)
- YouTube `controls=0`: verify on emulator on Day 1 of Sprint 2 Story #7 (if broken, design fallback immediately)
- Firebase Blaze plan: confirm before Sprint 2 ends (Cloud Function deployment in Sprint 3)
- Creator photo + design assets: must be confirmed by end of Sprint 0

---

## 5. Roadmap

| Milestone | Target Week | Deliverable |
|---|---|---|
| Sprint 0 complete | Week 1 | Dev-ready monorepo, Firebase configured, SDK audit done, assets confirmed |
| Sprint 1 complete | Week 3 | Onboarding works end-to-end on web (mobile viewport) |
| Web Live (core loop) | Week 5 | Stories #1–7 Web Done, deployed to Firebase Hosting |
| Web Live (all features) | Week 7 | Stories #8–10 Web Done, all features on Firebase Hosting |
| Play Store Submission | Week 9 | All stories Native App Done, EAS build submitted |

---

## 6. Archiving Rules

| File | Archive to completed/ when |
|---|---|
| `prd-N-web.md` | Pass 1 UAT passes and story merged |
| `prd-N-native.md` | Pass 2 UAT passes and story merged |
| `story-N.md` | BOTH Web Done + Native App Done fully ticked |
| `story-6.md` | Web Done fully ticked (web-only story) |

**prd output naming convention:**
- Pass 1 (web): `prd-N-web.md` (e.g. `prd-1-web.md`)
- Pass 2 (native): `prd-N-native.md` (e.g. `prd-1-native.md`)

**Rule:** story-N.md is never archived mid-story. It is the source of truth for /prd. It stays in the project root until both passes are complete.

---

## Story Status Legend

| Status | Meaning |
|---|---|
| Not Started | Story not yet in /prd |
| In Planning | /prd running |
| In Development | /dev running |
| In Review | PR open |
| In UAT | /uat running |
| Done | Merged + deployed |
| Web Done ✓ / Native App Done ☐ | Pass 1 complete, Pass 2 not started |
| Web Done ✓ / Native App Done ✓ | Story fully complete — move to completed/ |
| Web Only | Story #6 — no Native App pass |
