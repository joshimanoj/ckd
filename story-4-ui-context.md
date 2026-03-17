# Story #4 — Parental Gate | UI Context (Web Pass 1)

## Overview

Story #4 introduces the Parental Gate — a modal that guards parent-only surfaces (Dashboard, Settings, notification toggle) behind a simple arithmetic challenge. The gate is intended to be child-resistant, not adult-proof; single-digit sums and differences provide just enough friction to prevent accidental taps while remaining fast for a real parent.

This document covers design context for the Web pass only.

---

## Screens and Components

### 1. LibraryPage (`/library`)

The existing router stub (`<div data-testid="library-screen">Library (Story 5)</div>`) is replaced with a real page component.

**Layout:**
- Full-height screen, background `#F3E8FF`
- Top navigation bar: white background, 56px height, centred "Choti Ki Duniya" title in Baloo 2 SemiBold 18sp `#9333EA`, matching the AddChildScreen nav exactly
- Parent icon button fixed to the top-right of the nav bar — 44×44dp tap area, circular icon 32dp, ghost/transparent background, `data-testid="parent-icon-btn"`; use lock emoji or "👤" as placeholder icon
- Below the nav: a `data-testid="video-grid-placeholder"` div (Story 5 will replace)
- A `data-testid="parent-panel"` div hidden by default; shown only after the gate succeeds (represents the panel Stories 8/10 will flesh out)

**Behaviour:**
- Tapping the parent icon always opens the ParentalGate modal, regardless of prior sessions (no persistence)
- On gate success: hide gate, show parent panel
- On gate dismiss (X / back): hide gate, stay on library, do not show parent panel

---

### 2. ParentalGate Component

A modal overlay rendered on top of any screen. Reusable: the same component handles the Library trigger in this story and will handle Dashboard, Settings, and notification-toggle triggers in later stories.

**Props interface:**
```ts
interface ParentalGateProps {
  visible: boolean
  onSuccess: () => void
  onDismiss: () => void
}
```

**Visual structure (top to bottom within the card):**

1. X / dismiss button — absolute top-right of the card, ghost style, 44×44dp tap area, `data-testid="gate-dismiss-btn"`
2. Title row: "Parent access" — Baloo 2 Bold 20sp, `#1E1B4B`
3. Question text: e.g. "3 + 5 = ?" — Baloo 2 SemiBold 28sp, `#9333EA`; large and clear, centred
4. Answer input — numeric, centred, Nunito Regular 24sp, minimum 48px height, 16px border-radius, `#9333EA` focus ring (2px solid), `data-testid="gate-answer-input"`
5. "Confirm" button — full-width, pill shape 24px radius, 48px height; active bg `#7C3AED` text white; disabled bg `#D1D5DB` text `#9CA3AF`; `data-testid="gate-confirm-btn"`

**Modal card:**
- Background `#FAFAFA`
- Border-radius 20px (= 20dp on web)
- Width: `min(480px, calc(100vw - 32px))`
- Padding: 24px
- Centred horizontally and vertically over a dark scrim

**Scrim:**
- Fixed full-viewport, `rgba(0,0,0,0.5)`, `z-index: 1000`
- Does NOT close gate on scrim tap (child could accidentally tap it)

---

### 3. Shake Animation

Applied to the answer input wrapper on wrong answer. CSS keyframes named `gate-shake`:

- Duration: 200ms
- Keyframes: `0%/100%` translateX(0), `20%/60%` translateX(-8px), `40%/80%` translateX(8px)
- Declared in a `<style>` tag injected in the component (inline-styles-only pattern)

---

## Design Tokens (Web)

| Token | Value |
|---|---|
| Screen background | `#F3E8FF` |
| Modal card background | `#FAFAFA` |
| Modal border-radius | `20px` |
| Dark scrim | `rgba(0,0,0,0.5)` |
| Title font | Baloo 2 Bold 20sp / `#1E1B4B` |
| Question font | Baloo 2 SemiBold 28sp / `#9333EA` |
| Answer input font | Nunito Regular 24sp, centred |
| Answer input border-radius | `16px` |
| Answer input focus ring | `2px solid #9333EA` |
| Confirm button (active) | bg `#7C3AED`, text `#FFFFFF` |
| Confirm button (disabled) | bg `#D1D5DB`, text `#9CA3AF` |
| Confirm button height | `48px` |
| Confirm button border-radius | `24px` |
| Parent icon tap area | `44×44px` |
| Parent icon circle | `32px` diameter |
| Shake amplitude | `±8px` horizontal |
| Shake duration | `200ms` |
| Text primary | `#1E1B4B` |
| Text secondary | `#6B7280` |

---

## Responsive Behaviour

| Viewport | Expected behaviour |
|---|---|
| ≥ 768px | Modal card max-width 480px, centred |
| 480–767px | Modal card fills width with 16px side padding each side |
| < 480px | No horizontal scroll; modal card `calc(100vw - 32px)` |

The page itself uses `maxWidth: 100vw`, `overflowX: hidden` on the root container, matching AddChildScreen.

---

## Component File Locations

| File | Path |
|---|---|
| `ParentalGate.tsx` | `apps/web/src/features/parentalGate/components/ParentalGate.tsx` |
| `ParentalGate.test.tsx` | `apps/web/src/features/parentalGate/components/__tests__/ParentalGate.test.tsx` |
| `useParentalGate.ts` | `apps/web/src/shared/hooks/useParentalGate.ts` |
| `useParentalGate.test.ts` | `apps/web/src/shared/hooks/__tests__/useParentalGate.test.ts` |
| `LibraryPage.tsx` | `apps/web/src/pages/LibraryPage.tsx` |
| `LibraryPage.test.tsx` | `apps/web/src/pages/__tests__/LibraryPage.test.tsx` |
| `parentalGate.ts` (shared util) | `packages/shared/src/utils/parentalGate.ts` |
| `parentalGate.test.ts` (shared util) | `packages/shared/src/utils/__tests__/parentalGate.test.ts` |
| E2E spec | `apps/web/e2e/story-4/parental-gate.spec.ts` |

---

## Test IDs Reference

| Element | `data-testid` |
|---|---|
| Library screen root | `library-screen` |
| Top nav | `top-nav` |
| Parent icon button | `parent-icon-btn` |
| Video grid placeholder | `video-grid-placeholder` |
| Parent panel (post-success) | `parent-panel` |
| Gate modal root | `parental-gate-modal` |
| Gate dismiss button | `gate-dismiss-btn` |
| Gate question text | `gate-question` |
| Gate answer input | `gate-answer-input` |
| Gate confirm button | `gate-confirm-btn` |

---

## What This Story Does NOT Include

- Actual video grid (Story 5)
- Full Parent Panel / Dashboard UI (Stories 8, 10)
- Settings screen gate wiring (Story 9)
- Notification toggle gate (Story 10)
- Native / iOS pass (separate story)
- Any persistent session memory for the gate — it always re-challenges
