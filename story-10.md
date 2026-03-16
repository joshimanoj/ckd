# Story 10: Settings Screen & Privacy Policy Link

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 3 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent
I want to manage my notification preferences and access the Privacy Policy from a Settings screen
So that I feel in control of the app and can fulfil my compliance obligations

---

### Context

Settings is the second tab in the Parent Panel (alongside Dashboard). It is gated behind the Parental Gate (Story 4). The Settings screen covers: notification toggle, Privacy Policy link (opens external browser), and a Sign Out option. In V1 the screen is intentionally minimal — its primary compliance purpose is providing the Privacy Policy link inside the app (required for Google Play Families Policy) and exposing the notification opt-in/out toggle.

---

### Problem Statement

**Current State:** No in-app settings or privacy policy access.

**Pain Points:**
- Google Play Families Policy requires the Privacy Policy to be accessible from within the app
- Parents who initially declined notifications have no way to opt in later
- Parents have no way to sign out

**Desired State:** Simple, clean settings panel. Notification toggle, privacy policy link, sign out. Nothing else. Gated behind Parental Gate.

---

### User Flow

**Trigger:** Parent passes Parental Gate → Parent Panel opens → taps "Settings" tab.

**Steps:**
1. Settings screen renders inside Parent Panel bottom sheet (second tab)
2. Notification toggle:
   - Label: "New video notifications"
   - Subtitle: "Get notified when new rhymes are added"
   - Toggle switch (on/off) — reads from `users/{uid}.notificationsEnabled`
   - Toggling: requires Parental Gate re-confirmation (gate is already passed, but per design principles — toggling notification is a settings change that was gated on panel entry)
   - Toggling ON: checks Android notification permission → if not granted, opens Android Settings → if granted, updates `notificationsEnabled: true` in Firestore + refreshes FCM token
   - Toggling OFF: updates `notificationsEnabled: false` in Firestore (no permission revocation — OS handles that)
3. Privacy Policy link:
   - Label: "Privacy Policy"
   - Tapping opens external browser to Privacy Policy URL
   - This external link is permitted on parent-facing screens (not child-facing)
4. Sign Out:
   - Label: "Sign Out"
   - Taps → confirm dialog: "Are you sure you want to sign out?" with "Sign Out" (red) and "Cancel" buttons
   - On confirm: `signOut(auth)` → navigate to Sign In screen
5. App version displayed at bottom (non-interactive): "Version 1.0.0" — Nunito Regular 13sp, `#6B7280`

**Alternatives / Error States:**
- Notification toggle ON but permission denied at OS level → show toast: "Enable notifications in Android Settings" + button to open Android Settings for the app
- Firestore toggle write fails → toast error, toggle reverts visually, user can retry
- Privacy Policy URL not live yet → link still renders; interim: shows a placeholder page (must be live before Play Store submission)

---

### Acceptance Criteria

**Functional:**
- [ ] Settings screen accessible only via Parent Panel (after Parental Gate)
- [ ] Notification toggle reflects current `notificationsEnabled` state from Firestore
- [ ] Toggling ON: checks permission, prompts OS Settings if not granted, writes `notificationsEnabled: true` to Firestore on grant
- [ ] Toggling OFF: writes `notificationsEnabled: false` to Firestore
- [ ] Privacy Policy link opens external browser (not in-app webview)
- [ ] Sign Out triggers confirmation dialog, then `signOut(auth)` on confirm
- [ ] Sign Out navigates to Sign In screen and clears all Zustand stores
- [ ] App version number displayed (non-interactive)

**Non-Functional:**
- [ ] Toggle switch minimum 48dp tap area (larger hit area than visual switch)
- [ ] Settings items have clear visual separator (1dp line or 8dp vertical gap)
- [ ] Privacy Policy link visually distinct (underlined, `#9333EA` link colour)
- [ ] Sign Out label in error red `#EF4444` to signal destructive action
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] Parent taps Sign Out while video is playing → session flushed to Firestore, then sign out proceeds
- [ ] Notification toggle ON while OS permission is already granted → skip permission dialog, write directly
- [ ] Notification toggle changes while offline → queue write, apply when connection restores (or show error + revert)

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 3 (IA — Settings), 7 (Interaction Patterns — Button hierarchy, Form patterns)

**Key UI Elements:**
- Settings section inside Parent Panel bottom sheet (second tab, alongside Dashboard)
- Tab labels: "Dashboard" | "Settings" — Nunito SemiBold 14sp, `#9333EA` active, `#6B7280` inactive
- Row layout: icon (24dp, `#9333EA`) + label + subtitle + control (right-aligned)
- Toggle switch: `#9333EA` on-state, `#D1D5DB` off-state
- Privacy Policy row: no right-side control; right chevron icon (›)
- Sign Out row: `#EF4444` label, no icon, red destructive style
- Section header: "Account" — 11sp Nunito SemiBold UPPERCASE, `#6B7280`, 16dp left padding
- Divider: 1dp `#E5E7EB` between rows
- Version footer: "Version 1.0.0" — 13sp Nunito Regular, `#6B7280`, centred, 24dp bottom padding

**Visual Requirements:**
- Settings panel is clearly "adult" in tone — Nunito body text, not Baloo 2
- No gamified elements, no illustrations — functional and clean
- Parental Gate icon visible at top of Settings tab as reminder of gated access

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/notifications/hooks/useNotifications.ts` (update: toggle logic)
- `apps/mobile/src/features/auth/hooks/useAuth.ts` (update: sign-out + store clear)
- `apps/mobile/src/shared/navigation/RootNavigator.tsx` (update: Parent Panel bottom sheet with Settings tab)
- New `SettingsScreen.tsx` inside `apps/mobile/src/features/` (or inline in navigation if minimal)
- `apps/web/src/` mirrors mobile

**Dependencies:**
- Story 4 (Parental Gate) must be complete
- Story 9 (Push Notifications) must be complete — toggle uses `useNotifications` hook
- Story 1 (Auth) must be complete — sign-out uses `useAuth` hook

**API Contracts (Firebase):**
```ts
// Toggle notifications
updateDoc(doc(db, 'users', uid), { notificationsEnabled: toggleValue })

// On toggle ON: refresh FCM token
const token = await messaging().getToken()
updateDoc(doc(db, 'users', uid), { fcmToken: token, notificationsEnabled: true })

// Sign out
signOut(auth)
// Then clear Zustand stores:
authStore.getState().reset()
childProfileStore.getState().reset()
videoStore.getState().reset()
watchSessionStore.getState().reset()
```

**Privacy Policy URL:**
- Must be set as an environment constant before Play Store submission
- Interim: placeholder URL acceptable during development
- Final URL must be linked in Google Play Console app listing AND accessible from this Settings screen

**Compliance checklist for this story:**
- [ ] Privacy Policy link present and functional — Play Store requirement
- [ ] Privacy Policy link opens in browser (not in-app WebView on child screen — parent screen is fine with either)
- [ ] Notification toggle defaults to OFF — Play Families Policy requirement

---

### Complexity & Effort

**Score:** 2 (1 day)
**Estimated Tasks:** ~6 atomic tasks
**Risk Factors:**
- Opening Android Settings programmatically for notification permission: `Linking.openSettings()` in Expo — straightforward
- Sign-out must clear all Zustand stores to prevent stale state on next sign-in (add `reset()` action to each store)
- Privacy Policy URL not yet written or hosted — flag to founder as blocking item for Play Store submission (not a code blocker for this story)

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- Notification toggle logic (useNotifications hook — already written in Story 9 Pass 1)
- Sign-out + store clear logic (useAuth hook — already written in Story 1 Pass 1)
- Privacy Policy URL constant

**[WEB] — Pass 1 only:**
- `apps/web/src/features/settings/SettingsScreen.tsx` (HTML/CSS)
- Privacy Policy `<a href target="_blank">` link
- Integrated into side drawer Parent Panel (web)

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/settings/SettingsScreen.tsx` (RN)
- `Linking.openSettings()` for directing to Android notification settings
- `Linking.openURL()` for Privacy Policy external browser
- Integrated into bottom sheet Parent Panel (mobile)

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-10-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-10-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-10-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-10-native.md` → `completed/`
- [ ] Both passes complete → `story-10.md` → `completed/`
