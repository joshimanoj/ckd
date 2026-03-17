# Task Spec: Story #4 — Parental Gate | Pass 1 — Web

Generated: 2026-03-17 | Branch: feature/story-4-parental-gate-web
Sources: story-4.md · architecture.md
UI Context: story-4-ui-context.md | UAT: story-4-uat.md

---

## Context

This story creates the reusable `ParentalGate` modal component and its backing hook, wires it to a new `LibraryPage` stub (replacing the router placeholder), and ships the shared `generateGateQuestion()` utility used by all subsequent parent-facing stories.

**Router before this story:**
```tsx
{ path: '/library', element: <AuthGuard><div data-testid="library-screen">Library (Story 5)</div></AuthGuard> }
```

**After this story:** the placeholder div is replaced with `<LibraryPage />`.

**No changes** needed to `useAuth`, `AuthGuard`, `authStore`, or onboarding routing.

---

## Track B — Functional Tests (write first, start RED)

All 6 tests live in `apps/web/e2e/story-4/parental-gate.spec.ts`. Run with:
```
FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-4/
```

### Auth setup pattern (identical to all story-3 e2e tests)

```ts
import { test, expect } from '@playwright/test'
import {
  clearEmulatorData,
  createEmulatorUser,
  seedUserDoc,
  seedChildProfile,
  signInViaTestHelper,
} from '../support/emulator'

test.describe('Story 4 — Parental Gate', () => {
  test.skip(
    !process.env['FIREBASE_EMULATOR_RUNNING'],
    'Requires Firebase emulator — run: FIREBASE_EMULATOR_RUNNING=1 npx playwright test',
  )

  test.beforeEach(async ({ request }) => {
    await clearEmulatorData(request)
  })

  // helpers: each test creates its own user + seeds child profile, then navigates to /library
})
```

**Setup helper used in every FT:**
1. `clearEmulatorData(request)` — wipe emulator state
2. `createEmulatorUser(request, email, 'password123')` → `uid`
3. `seedUserDoc(request, uid, true)` — `consentGiven: true`
4. `seedChildProfile(request, uid)` — skip onboarding, router lands at `/library`
5. `page.goto('/')` + `signInViaTestHelper(page, email, 'password123')`
6. `await expect(page).toHaveURL('/library', { timeout: 10000 })`

---

### FT-1: Parent icon visible on library screen

**Criterion (AC1):** Tapping parent icon always triggers ParentalGate modal

**Test File:** `apps/web/e2e/story-4/parental-gate.spec.ts`

**User Flow:**
1. Auth setup → land on `/library`
2. Assert `data-testid="library-screen"` is visible
3. Assert `data-testid="parent-icon-btn"` is visible
4. Assert `data-testid="parental-gate-modal"` is NOT visible (gate not yet open)

**Assertions:**
- `library-screen` is visible
- `parent-icon-btn` is visible
- `parental-gate-modal` is not in the DOM / not visible

**Initial Status:** RED

---

### FT-2: Tapping parent icon opens gate modal with math question

**Criterion (AC1, AC2):** Gate question randomly generated on each display

**Test File:** `apps/web/e2e/story-4/parental-gate.spec.ts`

**User Flow:**
1. Auth setup → `/library`
2. Click `parent-icon-btn`
3. Assert `parental-gate-modal` is visible
4. Assert `gate-question` is visible and matches `/\d+ [+−] \d+ = \?/`
5. Assert `gate-dismiss-btn` is visible
6. Assert `gate-answer-input` is visible
7. Assert `gate-confirm-btn` is visible

**Assertions:**
- Modal appears on icon tap
- Question text matches expected math format
- All modal children visible

**Initial Status:** RED

---

### FT-3: Confirm button disabled when answer field is empty

**Criterion (AC3):** "Confirm" button disabled when answer field is empty

**Test File:** `apps/web/e2e/story-4/parental-gate.spec.ts`

**User Flow:**
1. Auth setup → `/library` → click `parent-icon-btn`
2. Assert `gate-confirm-btn` is disabled (answer field empty)
3. Fill `gate-answer-input` with "5"
4. Assert `gate-confirm-btn` is NOT disabled
5. Clear `gate-answer-input`
6. Assert `gate-confirm-btn` is disabled again

**Assertions:**
- Confirm disabled on empty input
- Confirm enabled when non-empty input
- Confirm re-disabled after clearing

**Initial Status:** RED

---

### FT-4: Wrong answer clears input, new question generated, modal stays open

**Criterion (AC5):** Wrong answer → field clears, new question, shake, modal stays

**Test File:** `apps/web/e2e/story-4/parental-gate.spec.ts`

**User Flow:**
1. Auth setup → `/library` → click `parent-icon-btn`
2. Read question text from `gate-question` → store as `firstQuestion`
3. Fill `gate-answer-input` with "99" (guaranteed wrong)
4. Click `gate-confirm-btn`
5. Assert `gate-answer-input` value is `""` (cleared)
6. Assert `parental-gate-modal` is still visible
7. Assert `gate-question` text differs from `firstQuestion` (new question generated)
8. Assert `data-testid="parent-panel"` is NOT visible

**Assertions:**
- Input cleared after wrong answer
- Modal stays open
- Question regenerated (different from prior)
- Parent panel not shown

**Initial Status:** RED

---

### FT-5: Correct answer closes modal

**Criterion (AC4):** Correct answer → modal closes → onSuccess called (parent panel visible)

**Test File:** `apps/web/e2e/story-4/parental-gate.spec.ts`

**User Flow:**
1. Auth setup → `/library` → click `parent-icon-btn`
2. Read question text from `gate-question` (e.g. "3 + 5 = ?")
3. Parse the question to compute the correct answer
4. Fill `gate-answer-input` with the correct answer
5. Click `gate-confirm-btn`
6. Assert `parental-gate-modal` is NOT visible
7. Assert `data-testid="parent-panel"` is visible

**Assertions:**
- Modal dismissed on correct answer
- Parent panel shown (onSuccess triggered)

**Implementation note:** Parse question with regex `/(\d+) ([+−]) (\d+)/` → compute answer in the test.

**Initial Status:** RED

---

### FT-6: X button closes modal, parent panel not shown

**Criterion (AC6):** Back/X on gate → modal closes → Video Library, no panel

**Test File:** `apps/web/e2e/story-4/parental-gate.spec.ts`

**User Flow:**
1. Auth setup → `/library` → click `parent-icon-btn`
2. Assert modal visible
3. Click `gate-dismiss-btn`
4. Assert `parental-gate-modal` is NOT visible
5. Assert `data-testid="parent-panel"` is NOT visible
6. Assert `data-testid="library-screen"` is still visible (no navigation)

**Assertions:**
- Modal closes on X tap
- Parent panel not revealed
- Library screen remains

**Initial Status:** RED

---

## Track A — Implementation Tasks

### Task 1 of 6: `generateGateQuestion()` shared utility + unit tests

**Type:** Feature

**Files:**
- Test: `packages/shared/src/utils/__tests__/parentalGate.test.ts` (new)
- Implementation: `packages/shared/src/utils/parentalGate.ts` (new)

**What to Build:**
```ts
export interface GateQuestion {
  question: string   // e.g. "3 + 5 = ?"
  answer: number     // e.g. 8
}

export const generateGateQuestion = (): GateQuestion => {
  const a = randomInt(1, 9)
  const b = randomInt(1, 9)
  const useAdd = Math.random() > 0.5
  if (useAdd) return { question: `${a} + ${b} = ?`, answer: a + b }
  const [big, small] = a >= b ? [a, b] : [b, a]
  return { question: `${big} − ${small} = ?`, answer: big - small }
}

// internal helper — not exported
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
```

**Edge cases:**
- Subtraction always produces result ≥ 0 (big − small, never small − big)
- Operands always 1–9 (never 0)
- Both `+` and `−` operators used across calls

**Test Requirements:**
- Mock `Math.random` → force addition path → assert `question` contains `+`, `answer` = sum
- Mock `Math.random` → force subtraction path → assert `question` contains `−`, `answer` = difference ≥ 0
- Run 100 real calls (no mock): all answers in range 0–18, all operands 1–9
- Subtraction result is never negative across 100 calls

**Implementation Notes:**
- Use the `−` character (U+2212 minus sign), not `-` (hyphen), to match design spec
- No external dependencies

---

### Task 2 of 6: `useParentalGate` hook + unit tests

**Type:** Feature

**Files:**
- Test: `apps/web/src/shared/hooks/__tests__/useParentalGate.test.ts` (new)
- Implementation: `apps/web/src/shared/hooks/useParentalGate.ts` (new)

**What to Build:**
```ts
interface UseParentalGateReturn {
  isVisible: boolean
  currentQuestion: GateQuestion
  showGate: () => void
  hideGate: () => void
  checkAnswer: (input: string) => boolean
  // checkAnswer returns true if correct; on wrong answer regenerates question
  // (guaranteed different from current — retries until different)
}

export function useParentalGate(): UseParentalGateReturn
```

**Behavior:**
- `showGate()` — sets `isVisible = true`, generates fresh question
- `hideGate()` — sets `isVisible = false`
- `checkAnswer(input)`:
  - Parses `input` as integer, compares to `currentQuestion.answer`
  - **Correct:** returns `true` (caller closes modal + calls onSuccess)
  - **Wrong:** generates new question (different from current, max 10 retries), returns `false`
- Question on mount: a valid `GateQuestion` (hook always starts with a question ready)

**Edge cases:**
- `checkAnswer("")` → returns `false`, does not throw
- `checkAnswer("abc")` → `parseInt("abc") = NaN`, treat as wrong
- No consecutive repeat: new question after wrong answer differs from previous question text

**Test Requirements:**
- Initial state: `isVisible = false`, `currentQuestion` is a valid GateQuestion
- `showGate()` → `isVisible = true`
- `hideGate()` → `isVisible = false`
- `checkAnswer` with correct answer (mock `generateGateQuestion` to return known answer) → returns `true`
- `checkAnswer` with wrong answer → returns `false`, `currentQuestion` changed
- After wrong answer, new question differs from the old one (no consecutive repeat)
- `checkAnswer("")` → `false`, no throw
- `checkAnswer("abc")` → `false`, no throw

**Implementation Notes:**
- Keep state in `useState` — no Zustand (gate state is local to each trigger)
- Import `generateGateQuestion` from `@ckd/shared/utils/parentalGate`

---

### Task 3 of 6: `ParentalGate` component — base UI

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/parentalGate/components/__tests__/ParentalGate.test.tsx` (new)
- Implementation: `apps/web/src/features/parentalGate/components/ParentalGate.tsx` (new)

**What to Build:**

Modal overlay driven entirely by props. No internal question state — receives `question` and `onConfirm`/`onDismiss` as props from the page via `useParentalGate`.

```tsx
interface ParentalGateProps {
  visible: boolean
  question: string            // e.g. "3 + 5 = ?"
  onConfirm: (answer: string) => void
  onDismiss: () => void
}
```

**DOM structure:**
```html
<!-- Fixed full-viewport scrim -->
<div data-testid="parental-gate-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.5); zIndex:1000; display:flex; alignItems:center; justifyContent:center">
  <!-- Modal card -->
  <div style="background:#FAFAFA; borderRadius:20px; padding:24px; width:min(480px,calc(100vw-32px)); position:relative">
    <!-- X button -->
    <button data-testid="gate-dismiss-btn" onClick={onDismiss} style="position:absolute; top:8px; right:8px; width:44px; height:44px; ...">×</button>
    <!-- Title -->
    <p style="fontFamily:'Baloo 2',sans-serif; fontWeight:700; fontSize:20px; color:#1E1B4B">Parent access</p>
    <!-- Question -->
    <p data-testid="gate-question" style="fontFamily:'Baloo 2',sans-serif; fontWeight:600; fontSize:28px; color:#9333EA; textAlign:center">{question}</p>
    <!-- Answer input -->
    <input data-testid="gate-answer-input" type="number" inputMode="numeric" value={answer} onChange={...}
      style="fontFamily:'Nunito',sans-serif; fontSize:24px; textAlign:center; minHeight:48px; borderRadius:16px; ..."/>
    <!-- Confirm button -->
    <button data-testid="gate-confirm-btn" disabled={answer === ''} onClick={() => onConfirm(answer)}
      style={{ background: answer === '' ? '#D1D5DB' : '#7C3AED', color: answer === '' ? '#9CA3AF' : '#fff', borderRadius:24px, height:48px, ... }}>
      Confirm
    </button>
  </div>
</div>
```

Returns `null` when `visible === false`.

**Test Requirements:**
- `visible=false` → renders nothing (null)
- `visible=true` → modal, question, input, confirm, dismiss all in DOM
- `gate-confirm-btn` is disabled when input is empty
- `gate-confirm-btn` is NOT disabled when input has value
- Typing in input and clicking Confirm calls `onConfirm` with the typed value
- Clicking dismiss calls `onDismiss`
- Clicking the scrim (outside the card) does NOT call `onDismiss`

**Implementation Notes:**
- Pure presentational component — no hooks called inside
- The inline `<style>` for the shake animation goes here (declared as a `<style>` tag inside the component — see Task 4)
- Scrim click: add `onClick` to scrim div; card div calls `event.stopPropagation()`
- Input `type="number"` — clear the value state on receiving a new `question` prop (useEffect)

---

### Task 4 of 6: Shake animation + wrong-answer state in ParentalGate

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/parentalGate/components/__tests__/ParentalGate.test.tsx` (extend Task 3 tests)
- Implementation: `apps/web/src/features/parentalGate/components/ParentalGate.tsx` (extend)

**What to Build:**

Add shake animation CSS and wrong-answer visual state to the component from Task 3.

**Shake keyframes** (injected as a `<style>` tag inside the component render):
```css
@keyframes gate-shake {
  0%,100% { transform: translateX(0) }
  20%,60% { transform: translateX(-8px) }
  40%,80% { transform: translateX(8px) }
}
```

**Shake trigger:**
- Add a `shaking` boolean prop to `ParentalGate`
- When `shaking === true`, apply `animation: gate-shake 200ms ease-in-out` to the input wrapper div
- Parent (`LibraryPage` via `useParentalGate`) sets `shaking = true` when `checkAnswer` returns `false`, then resets after 250ms (`setTimeout`)

**Answer clear on question change:**
- `useEffect([question], () => { setAnswer('') })` — when question changes (new question after wrong answer), clear the answer field

**Test Requirements:**
- When `shaking=true` prop: input wrapper has `animation` style containing `gate-shake`
- When `shaking=false`: no animation style applied
- When `question` prop changes: input value resets to `''`

**Implementation Notes:**
- Keep `shaking` as a prop — the hook/page owns the 250ms reset timer, not the component
- Do NOT loop the shake — `animation-iteration-count: 1` (default)

---

### Task 5 of 6: `LibraryPage` stub + gate wiring

**Type:** Feature

**Files:**
- Test: `apps/web/src/pages/__tests__/LibraryPage.test.tsx` (new)
- Implementation: `apps/web/src/pages/LibraryPage.tsx` (new)

**What to Build:**

```tsx
// LibraryPage renders:
// - data-testid="library-screen" root container, bg: #F3E8FF
// - Top nav: data-testid="top-nav", white bar, "Choti Ki Duniya" title centred
// - Parent icon: data-testid="parent-icon-btn" top-right, 44×44px, calls showGate()
// - data-testid="video-grid-placeholder" (Story 5)
// - data-testid="parent-panel" visible only when panelVisible === true
// - <ParentalGate visible={isVisible} question={currentQuestion.question}
//     onConfirm={handleConfirm} onDismiss={hideGate} shaking={shaking} />

export function LibraryPage() {
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const [panelVisible, setPanelVisible] = useState(false)
  const [shaking, setShaking] = useState(false)

  function handleConfirm(answer: string) {
    const correct = checkAnswer(answer)
    if (correct) {
      hideGate()
      setPanelVisible(true)
    } else {
      setShaking(true)
      setTimeout(() => setShaking(false), 250)
    }
  }

  return (
    <div data-testid="library-screen" style={{ minHeight:'100vh', background:'#F3E8FF' }}>
      <nav data-testid="top-nav" style={{ background:'#fff', height:56px, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <span style={{ fontFamily:'Baloo 2', fontWeight:600, fontSize:18, color:'#9333EA' }}>Choti Ki Duniya</span>
        <button data-testid="parent-icon-btn" onClick={showGate} style={{ position:'absolute', right:8, top:6, width:44, height:44, ... }}>
          🔒
        </button>
      </nav>
      <div data-testid="video-grid-placeholder" style={{ flex:1 }} />
      {panelVisible && <div data-testid="parent-panel">Parent Panel (Story 8)</div>}
      <ParentalGate
        visible={isVisible}
        question={currentQuestion.question}
        onConfirm={handleConfirm}
        onDismiss={hideGate}
        shaking={shaking}
      />
    </div>
  )
}
```

**Test Requirements:**
- Renders `library-screen`, `top-nav`, `parent-icon-btn`, `video-grid-placeholder`
- `parent-panel` is NOT visible initially
- Clicking `parent-icon-btn` causes `parental-gate-modal` to appear (mock `useParentalGate` to control `isVisible`)
- After `onConfirm` called with correct answer: `parent-panel` becomes visible, gate disappears
- After `onDismiss`: gate disappears, `parent-panel` stays hidden

**Implementation Notes:**
- Mock `useParentalGate` in unit tests — the hook's logic is tested separately in Task 2
- `shaking` reset timer: 250ms (5ms longer than animation — ensures animation completes)

---

### Task 6 of 6: Router update — wire `LibraryPage` at `/library`

**Type:** Feature

**Files:**
- Test: `apps/web/src/pages/__tests__/LibraryPage.test.tsx` (extend — routing smoke)
- Implementation: `apps/web/src/router.tsx`

**What to Build:**

In `router.tsx` replace:
```tsx
// BEFORE
{
  path: '/library',
  element: (
    <AuthGuard>
      <div data-testid="library-screen">Library (Story 5)</div>
    </AuthGuard>
  ),
}

// AFTER
import { LibraryPage } from './pages/LibraryPage'
{
  path: '/library',
  element: (
    <AuthGuard>
      <LibraryPage />
    </AuthGuard>
  ),
}
```

**Test Requirements:**
- Navigate to `/library` (with mocked auth) → `data-testid="library-screen"` is present
- The old placeholder text "Library (Story 5)" is gone

**Implementation Notes:**
- Only change in `router.tsx` is this swap — no other routes touched
- Any existing test that checked for the placeholder div text "Library (Story 5)" must be updated to check `data-testid="library-screen"` instead

---

## Known Test Gaps

None — all 7 acceptance criteria groups have corresponding executable FT tasks. Edge cases (no consecutive repeat, debounce on rapid Confirm) are covered in the hook unit tests and FT-4.

---

## Definition of Done

- [ ] All 6 Track A tasks complete
- [ ] All 6 Track B FTs GREEN (requires Firebase emulator)
- [ ] `vitest run` — zero failures
- [ ] `FIREBASE_EMULATOR_RUNNING=1 npx playwright test e2e/story-4/` — all 6 FTs GREEN
- [ ] `tsc --noEmit` — zero errors
- [ ] `eslint .` — zero errors
- [ ] `ParentalGate` props are `visible`, `question`, `onConfirm`, `onDismiss`, `shaking` — no page-specific coupling
- [ ] No Firebase / Firestore imports in `ParentalGate.tsx` or `useParentalGate.ts`
