# Story 3: Child Profile Setup

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 1 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent
I want to add my child's name and age so the app can personalise the experience and track watch time per child
So that I see data specific to my child, not mixed with other family members

---

### Context

After consent is given, the parent must create a child profile before accessing the video library. The profile stores the child's name and date of birth — the minimum data needed for the watch time dashboard to display meaningful per-child data. The data model supports multiple child profiles from day one (V1.1 will add a UI switcher), but V1 shows only one active profile.

This flow must feel warm and welcoming — it is the last step before the parent hands the phone to their child for the first time. Friction here is a risk.

---

### Problem Statement

**Current State:** No child profile exists. Watch time data cannot be attributed to a specific child.

**Pain Points:**
- Without a profile, watch sessions cannot be linked to a child
- Without a name, the dashboard feels generic and impersonal
- Date of birth is needed to display the child's age in the dashboard

**Desired State:** Parent enters their child's name and selects an age range in a single, friendly screen. Profile saved. Video library opens immediately.

---

### User Flow

**Trigger:** `consentGiven: true` + no child profiles exist in `users/{uid}/childProfiles/`

**Steps:**
1. Child Profile Setup screen renders (full-screen, modal-style or pushed screen)
2. Header: "Who's watching?" (Baloo 2 Bold 22sp) with creator avatar (40dp) alongside app name
3. Name input: large text field, placeholder "e.g. Arjun", Nunito Regular 17sp, friendly rounded border (16dp radius), label "Child's name *"
4. Age range selector: three large pill buttons — "Under 3", "3–4 years", "5–6 years" — only one selectable at a time (replaces free DOB input for UX simplicity; internally maps to a date range for Firestore storage)
5. "Start Watching" button (coral-red, pill, 48dp height, full-width) — disabled until name is entered and age range is selected
6. Parent fills in name and selects age range → taps "Start Watching"
7. Write `childProfiles/{auto-id}` document under `users/{uid}/childProfiles/`
8. Set as active child profile in `childProfileStore`
9. Navigate to Video Library

**Age range → DOB mapping (for Firestore `dateOfBirth` field):**
- "Under 3" → stores `dateOfBirth` as midpoint of the range (e.g. 18 months ago from today)
- "3–4 years" → 3.5 years ago from today
- "5–6 years" → 5.5 years ago from today
- Note: exact DOB not collected — age range sufficient for V1 dashboard display ("3–4 year old")

**Return visit flow (profile already exists):**
- `onAuthStateChanged` → `consentGiven: true` → child profile exists → skip this screen → go directly to Video Library

**Alternatives / Error States:**
- Name field empty → "Start Watching" disabled; do not show error until tap attempted
- Name field > 50 characters → trim to 50, no error (edge case protection)
- Firestore write fails → toast error "Couldn't save profile. Try again.", stay on screen

---

### Acceptance Criteria

**Functional:**
- [ ] Screen renders automatically when `consentGiven: true` and no child profiles exist
- [ ] Name input validates that a non-empty name is entered (trim whitespace)
- [ ] Age range selector shows three options; only one selectable at a time
- [ ] "Start Watching" button disabled until both name and age range are filled
- [ ] On confirm: `childProfiles/{autoId}` document written to Firestore with `name`, `dateOfBirth`, `createdAt`
- [ ] Active child profile set in `childProfileStore` after write
- [ ] App navigates to Video Library after successful profile creation
- [ ] Returning users with existing profile skip this screen entirely

**Non-Functional:**
- [ ] Name input minimum 48dp height touch target
- [ ] Age range pill buttons minimum 48dp height each
- [ ] Keyboard dismissed correctly on "Start Watching" tap (no stuck keyboard)
- [ ] Screen does not require scrolling on standard screen sizes (all elements fit without scroll)
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] Name is only whitespace → treated as empty, button stays disabled
- [ ] Firestore write fails → error toast, no navigation, user can retry
- [ ] User navigates back from this screen → if no profile exists, return to this screen (not consent, not sign-in)

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 4 (Flow 1, steps 3–4), 6 (Design System), 7 (Interaction Patterns — Form patterns)

**Key UI Elements:**
- Header: "Who's watching?" — Baloo 2 Bold 22sp, `#1E1B4B`
- Name input: 16dp border-radius, `#9333EA` focus border, 17sp Nunito Regular
- Age pills: `#F3E8FF` background (unselected), `#9333EA` background (selected), Nunito SemiBold 600 15sp, 20dp border-radius, min 48dp height
- "Start Watching" CTA: coral-red `#F43F5E` when active, grey when disabled, pill 24dp, 48dp height
- Background: light purple `#F3E8FF` (child-facing context signals)
- Inline form validation: 13sp Nunito, `#EF4444`, appears below field on blur

**Visual Requirements:**
- Creator's circular avatar (40dp) in header to maintain brand presence
- No external links on this screen

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/childProfile/components/AddChildScreen.tsx` (new)
- `apps/mobile/src/features/childProfile/hooks/useChildProfile.ts` (new)
- `apps/mobile/src/features/childProfile/services/childProfileService.ts` (new)
- `apps/mobile/src/shared/store/childProfileStore.ts` (new)
- `apps/web/src/features/childProfile/` (mirrors mobile)
- `packages/shared/src/types/user.ts` (ChildProfile interface)
- `packages/shared/src/firebase/collections.ts` (childProfiles collection ref)

**Dependencies:**
- Story 2 (Consent Flow) must be complete
- `users/{uid}` document must exist (created in Story 1)

**API Contracts (Firebase):**
```ts
// Create child profile
addDoc(collection(db, 'users', uid, 'childProfiles'), {
  name: childName.trim(),
  dateOfBirth: Timestamp.fromDate(derivedDobFromAgeRange),
  createdAt: serverTimestamp()
})

// Check if profile exists (on auth state)
getDocs(collection(db, 'users', uid, 'childProfiles'))
```

**Data Model:**
```
users/{uid}/childProfiles/{childProfileId}
  name: string
  dateOfBirth: Timestamp    ← derived from age range selection
  createdAt: Timestamp
```

**Compliance note:** Only `name` and `dateOfBirth` are collected — minimum necessary per DPDP Act. No gender, no photo, no precise location.

---

### Complexity & Effort

**Score:** 2 (1 day)
**Estimated Tasks:** ~6 atomic tasks
**Risk Factors:**
- Age range → DOB derivation logic needs a clear utility function in `packages/shared/src/utils/` to ensure consistency between mobile and web
- Keyboard avoidance on Android must be tested (KeyboardAvoidingView in Expo)

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- `packages/shared/src/types/user.ts` — ChildProfile interface
- `packages/shared/src/firebase/collections.ts` — childProfiles ref
- `packages/shared/src/utils/` — age range → DOB derivation utility
- `apps/*/src/features/childProfile/hooks/useChildProfile.ts`
- `apps/*/src/features/childProfile/services/childProfileService.ts`
- `apps/*/src/shared/store/childProfileStore.ts`

**[WEB] — Pass 1 only:**
- `apps/web/src/features/childProfile/components/AddChildScreen.tsx` (HTML form)
- `apps/web/src/pages/OnboardingPage.tsx` (child profile step)

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/childProfile/components/AddChildScreen.tsx` (RN TextInput, TouchableOpacity)
- `KeyboardAvoidingView` wrapper for Android keyboard handling

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-3-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-3-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-3-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-3-native.md` → `completed/`
- [ ] Both passes complete → `story-3.md` → `completed/`
