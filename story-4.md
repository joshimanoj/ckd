# Story 4: Parental Gate

**Current Pass: 1 — Web** | Native App deferred

**Status:** Not Started | **Sprint:** 1 | **Type:** UI story — /uat required after /check

---

### User Story

As the app system
I want to present a simple cognitive challenge before a parent accesses the Dashboard or Settings
So that young children cannot accidentally access or modify parent controls

---

### Context

The Parental Gate is a Google Play Families Policy recommendation for child-directed apps. It protects parent-facing screens from child access. The gate is a randomly generated single-digit addition or subtraction maths question (e.g. "What is 4 + 7?") that a young child cannot reliably answer. It is shown as a modal overlay every time the parent taps the parent icon — no session memory, no bypass. Wrong answers reset with a new question (no lockout).

This story creates the reusable `ParentalGate` component and the `useParentalGate` hook used by all subsequent parent-facing stories (Dashboard in Story 8, Settings in Story 10).

---

### Problem Statement

**Current State:** No protection mechanism between child-facing and parent-facing screens.

**Pain Points:**
- Without a gate, a child exploring the app could stumble onto the dashboard
- Without a gate, notification opt-in/out could be accidentally toggled by a child
- Google Play Families Policy recommends a parental gate for child-directed apps

**Desired State:** Every time the parent icon is tapped, a maths question modal appears. Correct answer → Parent Panel opens. Wrong answer → new question, same modal. Dismiss → back to Library. Children cannot solve the gate reliably.

---

### User Flow

**Trigger:** Parent taps the circular parent icon (top-right of Video Library screen)

**Steps:**
1. `ParentalGate` modal renders as overlay (non-dismissable via outside tap, dismissable via explicit X button or system back)
2. Modal title: "Parent access" (Baloo 2 Bold 20sp)
3. Question displayed: "What is [A] [+/-] [B]?" where A and B are single digits; result is always positive (avoid negatives for simplicity)
4. Numeric keypad displayed (custom 0–9 grid, large tap targets) OR system keyboard with numeric input type
5. Parent types their answer
6. Taps "Confirm"
   - Correct: modal dismisses → Parent Panel bottom sheet slides up (showing Dashboard and Settings tabs)
   - Wrong: modal stays open, question regenerates, answer field clears, brief shake animation on the input
7. Parent taps back/X → modal dismisses → returns to Video Library with no panel opening

**Question generation logic:**
- Two operands A and B, both single-digit (1–9)
- Operator: randomly + or −
- For subtraction: ensure A ≥ B (result always ≥ 0)
- Answer is an integer, always in range 0–18

**Alternatives / Error States:**
- Empty answer → "Confirm" disabled
- Non-numeric input → not possible (numeric keypad only)
- Multiple wrong answers → no lockout, no limit; new question regenerated on each wrong attempt

---

### Acceptance Criteria

**Functional:**
- [ ] Tapping parent icon always triggers ParentalGate modal (no session memory / no "stay logged in as parent")
- [ ] Gate question is randomly generated on each display (single-digit operands, +/− operator, result ≥ 0)
- [ ] "Confirm" button disabled when answer field is empty
- [ ] Correct answer → modal closes → Parent Panel bottom sheet opens
- [ ] Wrong answer → answer field clears, new question generated, shake animation on input, modal stays open
- [ ] Back button / X button on gate modal → modal closes → Video Library, no panel opened
- [ ] Gate component is reusable — used before Dashboard, before Settings, before notification toggle

**Non-Functional:**
- [ ] Numeric input only (keypad type set to numeric, no alphabetic keyboard)
- [ ] Answer input minimum 48dp height
- [ ] Modal border-radius 20dp per design system
- [ ] Shake animation: brief (200ms), horizontal (±8dp), no excessive distraction
- [ ] Gate regenerates question on wrong answer — same question not repeated consecutively (randomise)
- [ ] [WEB] Renders correctly at 480–768px (primary mobile web target)
- [ ] [WEB] No horizontal scroll at viewport widths < 480px

**Edge Cases:**
- [ ] Child taps parent icon repeatedly → gate shows fresh each time
- [ ] Rapid "Confirm" taps on wrong answer → debounce to prevent flicker
- [ ] Gate shown on top of a loading state → gate should not be blocked by library loading indicator

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 3 (IA — Parent Panel), 7 (Interaction Patterns — Parental Gate)

**Key UI Elements:**
- Modal overlay: semi-transparent dark scrim behind modal card
- Card: `#FAFAFA` background, 20dp border-radius, centred on screen
- Title: "Parent access" — Baloo 2 Bold 20sp, `#1E1B4B`
- Question text: Baloo 2 SemiBold 28sp, `#9333EA` — large and clear
- Answer input: Nunito Regular 24sp, centred, 16dp border-radius, `#9333EA` focus ring
- "Confirm" button: violet `#7C3AED` when active, grey disabled, pill, 48dp height
- X / dismiss button: top-right of modal, ghost style, 44×44dp tap area
- Parent icon (trigger): 32dp circular avatar / lock icon in top-right of Library header, 44×44dp tap area

**Visual Requirements:**
- Parental Gate must look clearly "adult" — no cartoon elements, clean modal
- Parent icon on Library screen: subtle, not distracting to a child but visible to a parent

---

### Technical Notes

**Files Affected:**
- `apps/mobile/src/shared/components/ParentalGate.tsx` (new — shared component)
- `apps/mobile/src/shared/hooks/useParentalGate.ts` (new — gate logic, question generation)
- `apps/mobile/src/features/videoLibrary/components/VideoGrid.tsx` (update: add parent icon + gate trigger)
- `apps/web/src/shared/components/ParentalGate.tsx` (mirrors mobile)

**Dependencies:**
- Story 5 (Video Library) will consume the parent icon and gate trigger — coordinate component interface
- Story 8 (Dashboard) and Story 10 (Settings) gate to parent panel after this story's component exists

**Component Interface:**
```ts
interface ParentalGateProps {
  visible: boolean
  onSuccess: () => void    // called when correct answer entered
  onDismiss: () => void    // called when back/X pressed
}
```

**Question generation utility:**
```ts
// packages/shared/src/utils/parentalGate.ts
export const generateGateQuestion = (): { question: string; answer: number } => {
  const a = randomInt(1, 9)
  const b = randomInt(1, 9)
  const useAdd = Math.random() > 0.5
  if (useAdd) return { question: `${a} + ${b}`, answer: a + b }
  const [big, small] = a >= b ? [a, b] : [b, a]
  return { question: `${big} − ${small}`, answer: big - small }
}
```

---

### Complexity & Effort

**Score:** 2 (1 day)
**Estimated Tasks:** ~5 atomic tasks
**Risk Factors:**
- Android back button must close the gate cleanly — intercept `BackHandler` in React Native
- Shake animation: use `Animated` API (no third-party animation lib needed)

---

### Platform Split

**[SHARED] — written in Pass 1, imported by Pass 2:**
- `packages/shared/src/utils/parentalGate.ts` — `generateGateQuestion()` utility
- Gate logic (question validation, answer check)

**[WEB] — Pass 1 only:**
- `apps/web/src/shared/components/ParentalGate.tsx` (HTML/CSS modal overlay)
- `apps/web/src/shared/hooks/useParentalGate.ts`
- CSS shake animation on wrong answer

**[NATIVE] — Pass 2 only:**
- `apps/mobile/src/shared/components/ParentalGate.tsx` (RN Modal)
- `apps/mobile/src/shared/hooks/useParentalGate.ts`
- `BackHandler` intercept (Android back button closes gate cleanly)
- `Animated` API shake animation on wrong answer

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-4-web.md`:**
- [ ] [SHARED] hooks, services, types, Firebase calls written
- [ ] [WEB] Web UI components complete (React/HTML)
- [ ] [WEB] Responsive: renders correctly at 480–768px
- [ ] [WEB] Responsive: no horizontal scroll at < 480px
- [ ] /check passed on web
- [ ] /uat passed on web
- [ ] Deployed to Firebase Hosting
- [ ] `prd-4-web.md` → `completed/`

**Native App Done (Pass 2 — React Native + Expo) — outputs `prd-4-native.md`:**
- [ ] [NATIVE] RN UI components ported (React Native primitives)
- [ ] [NATIVE] Mobile-specific APIs wired in
- [ ] /check passed on Pixel 7 API 34 emulator
- [ ] /uat passed on mobile
- [ ] `prd-4-native.md` → `completed/`
- [ ] Both passes complete → `story-4.md` → `completed/`
