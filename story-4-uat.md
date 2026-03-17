# Story #4 — Parental Gate | UAT Checklist (Web Pass 1)

**Branch:** `feature/story-4-parental-gate-web`
**Test URL:** `http://localhost:5173`
**Prerequisites:** Firebase emulators running, app running on port 5173, signed-in user with `consentGiven: true` and at least one child profile seeded (so the router lands at `/library`).

---

## UAT-1: Library screen renders correctly

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 1.1 | Navigate to `/library` as authenticated user with a child profile | Page renders without errors | |
| 1.2 | Inspect top navigation bar | Nav bar visible, height ~56px, white background, "Choti Ki Duniya" title centred in purple (`#9333EA`) | |
| 1.3 | Locate parent icon button | Button visible in the top-right of the nav bar | |
| 1.4 | Check parent icon tap area | Button is at least 44×44px (inspect via DevTools) | |
| 1.5 | Check video grid placeholder | `data-testid="video-grid-placeholder"` element is present in DOM | |
| 1.6 | Check parent panel initial state | `data-testid="parent-panel"` is NOT visible on initial load | |
| 1.7 | Resize to 375px width | No horizontal scrollbar appears | |
| 1.8 | Resize to 480px width | No horizontal scrollbar appears, layout fills width correctly | |

---

## UAT-2: Parental gate modal opens

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 2.1 | Tap the parent icon button | Gate modal appears over a dark scrim (`rgba(0,0,0,0.5)`) | |
| 2.2 | Check modal card background | Card background is `#FAFAFA`, border-radius visually ~20px | |
| 2.3 | Check title | "Parent access" text visible, Baloo 2 Bold, dark navy colour | |
| 2.4 | Check question text | A math question of the form `X + Y = ?` or `X − Y = ?` is visible, large purple text (~28sp) | |
| 2.5 | Verify single-digit operands | Both operands in the question are 1–9 | |
| 2.6 | Check answer input | Numeric input field visible, centred, min height ~48px, 16px border-radius | |
| 2.7 | Check Confirm button initial state | "Confirm" button is disabled (greyed out, `#D1D5DB` background) when answer field is empty | |
| 2.8 | Check X / dismiss button | X button visible at top-right of modal card, at least 44×44px tap area | |
| 2.9 | Check scrim tap | Tapping the dark scrim area does NOT close the modal | |

---

## UAT-3: Gate — correct answer flow

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 3.1 | Open gate modal | Math question displayed | |
| 3.2 | Read the question and compute the answer | — | |
| 3.3 | Type the correct answer in the input | Confirm button becomes active (`#7C3AED` purple background) | |
| 3.4 | Tap "Confirm" | Modal closes; parent panel (`data-testid="parent-panel"`) becomes visible | |
| 3.5 | Verify library screen still visible behind | Library background/nav still rendered | |

---

## UAT-4: Gate — wrong answer flow

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 4.1 | Open gate modal, note the question | — | |
| 4.2 | Type a clearly wrong answer (e.g. "99") | Confirm button is active | |
| 4.3 | Tap "Confirm" | Answer field clears to empty; Confirm button returns to disabled | |
| 4.4 | Observe shake animation | Input field (or its wrapper) visibly shakes horizontally (≈200ms, ±8px) | |
| 4.5 | Observe new question | A new question is generated — it should differ from the previous one | |
| 4.6 | Verify modal still open | Modal remains visible after wrong answer | |
| 4.7 | Verify no consecutive repeat | Repeat wrong answer several times; the same question should not appear twice in a row | |
| 4.8 | Rapid "Confirm" taps | Tapping "Confirm" rapidly on wrong answer does not stack multiple question changes (debounce in effect) | |

---

## UAT-5: Gate — dismiss flow

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 5.1 | Open gate modal | Modal visible | |
| 5.2 | Tap the X / dismiss button | Modal closes | |
| 5.3 | Verify parent panel not shown | `data-testid="parent-panel"` is NOT visible | |
| 5.4 | Verify library screen intact | Library nav and content are still visible; no navigation occurred | |

---

## UAT-6: Gate — fresh challenge every time

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 6.1 | Open gate modal, note the question, then dismiss | — | |
| 6.2 | Tap parent icon again | A new gate modal opens with a freshly generated question | |
| 6.3 | Confirm: no session memory | The previous answer is not pre-filled; the answer field is empty | |
| 6.4 | Repeat 5 times | Gate opens fresh each time; no cached answer or state from prior sessions | |

---

## UAT-7: Question generation quality

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 7.1 | Open and dismiss gate 20 times, recording each question | All questions are either addition (`+`) or subtraction (`−`) | |
| 7.2 | Inspect subtraction questions | All subtraction results are ≥ 0 (bigger − smaller, no negatives) | |
| 7.3 | Inspect operands | All operands are single digits (1–9) | |
| 7.4 | Observe variety | A mix of `+` and `−` appears over 20 questions (not all the same operator) | |

---

## UAT-8: Input behaviour

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 8.1 | Tap answer input on a mobile-width viewport (375px) | Numeric keyboard appears (on real device) or input type is numeric | |
| 8.2 | Type alphabetic characters in the input | Non-numeric characters are not accepted or not processed | |
| 8.3 | Tap input | Focus ring appears (`#9333EA`, 2px solid) | |
| 8.4 | Check input height | Input height is at least 48px | |

---

## UAT-9: Responsiveness

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 9.1 | Open gate modal at 768px viewport width | Modal card centred, max-width 480px, not overly wide | |
| 9.2 | Open gate modal at 480px viewport width | Modal card fills available width with ~16px padding each side | |
| 9.3 | Open gate modal at 375px viewport width | Modal card fills width, no horizontal scroll, all content readable | |
| 9.4 | Open gate modal at 320px viewport width | No horizontal scroll; confirm button and input remain usable | |

---

## UAT-10: Reusability (smoke check)

> Note: Full Dashboard / Settings wiring is out of scope for this story. This is a structural smoke check.

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 10.1 | Inspect `ParentalGate` component in source | Component accepts `visible`, `onSuccess`, `onDismiss` props with no hard-coded page dependencies | |
| 10.2 | Inspect `useParentalGate` hook in source | Hook is standalone (not tied to LibraryPage); could be imported in any page component | |

---

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Product | | | |
| Developer | | | |
| QA | | | |
