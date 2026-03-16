# Story 2: DPDP Parental Consent Flow

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 1 | **Type:** UI story — /uat required after /check

---

### User Story

As a parent
I want to be clearly informed about what data is collected about my child and give explicit consent
So that I can trust the app is transparent and compliant with Indian privacy law

---

### Context

India's Digital Personal Data Protection Act (DPDP Act, 2023) requires verifiable parental consent before processing a child's personal data. Google Play Families Policy requires an explicit, un-pre-checked consent checkbox. This flow is non-negotiable — the app cannot proceed to child profile creation without it. The consent record (boolean + timestamp) must be stored in Firestore and is the legal evidence of compliance.

This story implements the mandatory ConsentModal that appears after first Google Sign-In, before any child data is collected. It is non-dismissable — the parent cannot tap outside to close it or use the back button to bypass it.

---

### Problem Statement

**Current State:** No consent mechanism exists. Child data would be collected without explicit acknowledgement, violating DPDP Act.

**Pain Points (compliance perspective):**
- Missing consent = Google Play rejection risk
- Missing consent = DPDP Act violation = legal exposure
- Pre-checked boxes or implied consent are not accepted under DPDP Act

**Desired State:** Parent reads a clear, plain-language data disclosure, ticks an unchecked checkbox, and taps "I Agree & Continue". Consent is recorded in Firestore with a timestamp. App proceeds to child profile setup.

---

### User Flow

**Trigger:** `onAuthStateChanged` fires → user document has `consentGiven: false` → ConsentModal rendered.

**Steps:**
1. ConsentModal appears as a full-screen non-dismissable overlay (no backdrop tap-to-close)
2. Modal title: "Before we begin" (Baloo 2 Bold 22sp)
3. Body text (Nunito Regular 15sp) lists exactly:
   - Your name and email (from your Google account)
   - Your child's name and date of birth
   - How long your child watches each video (watch time data)
   - Your device token (to send you notifications, only if you opt in)
4. Why it's collected: "To personalise your child's profile, show you watch time, and notify you about new videos."
5. Un-pre-checked checkbox: "I have read and agree to the [Privacy Policy] and consent to the collection of my child's usage data as described above."
   - "Privacy Policy" is a text link → opens external browser (this is the parent-context modal, so external links are permitted here)
6. "I Agree & Continue" button — **disabled** until checkbox is ticked
7. Parent ticks checkbox → button activates (coral-red, full opacity)
8. Parent taps "I Agree & Continue":
   - Write to `users/{uid}`: `consentGiven: true`, `consentTimestamp: serverTimestamp()`
   - Navigate to Child Profile Setup (Story 3)

**Alternatives / Error States:**
- Parent cannot dismiss modal without ticking — back button does nothing, tap-outside does nothing
- Write to Firestore fails (network): show toast "Something went wrong. Please try again." Keep modal open.
- Privacy Policy URL not yet live: link shows but navigates to placeholder page (to be resolved before Play Store submission)

---

### Acceptance Criteria

**Functional:**
- [ ] ConsentModal renders automatically when `consentGiven: false` on authenticated user
- [ ] Modal is non-dismissable (back button, outside tap, swipe gesture all blocked)
- [ ] Checkbox renders unchecked by default — cannot be pre-checked
- [ ] "I Agree & Continue" button is disabled until checkbox is ticked
- [ ] On confirm: `consentGiven: true` and `consentTimestamp: serverTimestamp()` written to `users/{uid}`
- [ ] On confirm: navigate to Child Profile Setup (Story 3)
- [ ] Privacy Policy link opens external browser (acceptable in parent-context modal)
- [ ] Consent data listed in modal matches exactly what is collected per architecture.md Section 9

**Non-Functional:**
- [ ] Checkbox hit target minimum 48×48dp (large enough for adult thumb)
- [ ] Body text minimum 15sp Nunito Regular
- [ ] Modal border-radius 20dp per design system
- [ ] Colour contrast on body text meets WCAG AA (4.5:1 minimum)
- [ ] Firestore write uses `serverTimestamp()` not client time (authoritative timestamp)
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px
- [ ] [WEB] Top navigation bar renders (replaces bottom nav on web) — per Design.md Section 9

**Edge Cases:**
- [ ] Firestore write failure → error toast, modal stays open, no navigation
- [ ] User kills app after ticking but before tapping confirm → on relaunch, consent modal shows again with checkbox unchecked
- [ ] User who already consented (`consentGiven: true`) never sees this modal again

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 3 (IA — Consent Modal), 4 (Flow 1, steps 1–2), 6 (Design System), 7 (Interaction Patterns)

**Key UI Elements:**
- Modal: full-screen overlay, `#FAFAFA` background, 20dp top border-radius if presented as bottom sheet (or centred card with 20dp all-round radius)
- Title: "Before we begin" — Baloo 2 Bold 22sp, `#1E1B4B`
- Body: Nunito Regular 15sp, `#1E1B4B`, generous line-height (1.5)
- Checkbox: standard Android checkbox, brand purple accent `#9333EA` when checked
- Checkbox label: Nunito Regular 14sp, `#1E1B4B`; "Privacy Policy" text link in `#9333EA` underlined
- CTA button: coral-red `#F43F5E` when active, `#D1D5DB` (grey, 40% opacity) when disabled, 48dp height, pill (24dp radius), Nunito SemiBold white label

**Visual Requirements:**
- No creator photo in this modal — this is a legal/trust screen, not a brand screen
- No external links other than Privacy Policy

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/features/auth/components/ConsentModal.tsx` (new)
- `apps/mobile/src/features/auth/hooks/useAuth.ts` (update: add consent write logic)
- `apps/mobile/src/features/auth/services/authService.ts` (update: `recordConsent()` function)
- `apps/web/src/features/auth/components/ConsentModal.tsx` (mirrors mobile)
- `packages/shared/src/types/user.ts` (consentGiven, consentTimestamp fields already defined)

**Dependencies:**
- Story 1 (Authentication) must be complete — ConsentModal depends on authenticated user and `users/{uid}` document existing

**API Contracts (Firebase):**
```ts
// Record consent
updateDoc(doc(db, 'users', uid), {
  consentGiven: true,
  consentTimestamp: serverTimestamp()
})
```

**Compliance note:**
- Checkbox MUST default to unchecked — pre-checked is not compliant with DPDP Act
- `consentTimestamp` MUST use `serverTimestamp()` for legal defensibility
- This consent record is the legal evidence of DPDP Act compliance — do not skip the Firestore write

---

### Complexity & Effort

**Score:** 2 (1 day)
**Estimated Tasks:** ~5 atomic tasks
**Risk Factors:**
- Privacy Policy URL must be live before Play Store submission (content of policy is out of scope for this story — see Story 10)
- DPDP Act requires the consent to be "verifiable" — the Firestore timestamp record satisfies this for V1

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- `apps/*/src/features/auth/services/authService.ts` — `recordConsent()` function
- Consent field types already in `packages/shared/src/types/user.ts`

**[WEB] — Pass 1 only:**
- `apps/web/src/features/auth/components/ConsentModal.tsx` (HTML/CSS modal)
- Web modal dismiss behaviour (click outside blocked via CSS)

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/features/auth/components/ConsentModal.tsx` (RN Modal component)
- Android BackHandler intercept (prevent dismiss on back button)

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-2-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-2-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-2-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-2-native.md` → `completed/`
- [ ] Both passes complete → `story-2.md` → `completed/`
