# PRD: Story #2 — DPDP Parental Consent Flow | Pass 1 — Web

Generated: 2026-03-16 | Source: story-2.md · architecture.md · Design.md v1.0
Tech stack: React 18 + Vite + TypeScript | Vitest + RTL (unit) | Firebase Local Emulator (integration) | Playwright (E2E)

---

## Track B — Functional Tests (write first, start RED)

### Functional Test FT-1: ConsentModal Renders for Unauthenticated-Then-Signed-In User

**Criterion (from story-2.md):** ConsentModal renders automatically when `consentGiven: false` on authenticated user

**Test File:** `apps/web/e2e/story-2/consent-renders.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Clear emulator data
2. Create emulator user (no Firestore doc yet)
3. Navigate to `/`
4. Sign in via `__testSignIn`
5. Wait for redirect to `/consent`
6. Assert all required modal elements are visible

**Assertions:**
- `page.url()` contains `/consent`
- `[data-testid="consent-modal"]` is visible
- `[data-testid="consent-title"]` has text "Before we begin"
- `[data-testid="consent-checkbox"]` is visible
- `[data-testid="consent-submit-btn"]` is visible
- `[data-testid="consent-privacy-link"]` is visible with text "Privacy Policy"
- Body text contains "Your name and email"
- Body text contains "Your child's name and date of birth"
- Body text contains "watch time data"
- Body text contains "device token"

**Initial Status:** RED (ConsentModal stub exists but contains no real content)

---

### Functional Test FT-2: Modal Is Non-Dismissable

**Criterion (from story-2.md):** Modal is non-dismissable (back button, outside tap, swipe gesture all blocked)

**Test File:** `apps/web/e2e/story-2/consent-non-dismissable.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Clear emulator, create user, sign in
2. Wait for `/consent`
3. Click backdrop area (outside modal card)
4. Assert still on `/consent`
5. Press `Escape` key
6. Assert still on `/consent`
7. Navigate browser back (`page.goBack()`)
8. Assert redirected back to `/consent` (AuthGuard re-applies)

**Assertions:**
- After backdrop click: `page.url()` contains `/consent`, `[data-testid="consent-modal"]` still visible
- After Escape: `page.url()` contains `/consent`
- After `page.goBack()`: eventually `page.url()` contains `/consent` (AuthGuard redirects)

**Implementation note:** Non-dismissable achieved by: (a) no `onClick` on backdrop div, (b) no `keydown` Escape listener, (c) AuthGuard's routing loop keeps redirecting to `/consent` while `consentGiven: false`

**Initial Status:** RED

---

### Functional Test FT-3: Checkbox Unchecked by Default; Button Disabled Until Checked

**Criterion (from story-2.md):** Checkbox renders unchecked by default — cannot be pre-checked; "I Agree & Continue" button is disabled until checkbox is ticked

**Test File:** `apps/web/e2e/story-2/consent-checkbox-gating.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Clear emulator, create user, sign in
2. Wait for `/consent`
3. Assert checkbox is unchecked
4. Assert submit button is disabled
5. Click checkbox
6. Assert checkbox is checked
7. Assert submit button is enabled (not disabled)
8. Click checkbox again (untick)
9. Assert button disabled again

**Assertions:**
- Initial: `[data-testid="consent-checkbox"]` not checked
- Initial: `[data-testid="consent-submit-btn"]` is disabled
- After check: `[data-testid="consent-checkbox"]` is checked
- After check: `[data-testid="consent-submit-btn"]` is not disabled, has computed background-color matching `#F43F5E` (coral-red)
- After uncheck: `[data-testid="consent-submit-btn"]` is disabled again

**Initial Status:** RED

---

### Functional Test FT-4: On Confirm — Firestore consentGiven:true + consentTimestamp Written

**Criterion (from story-2.md):** On confirm: `consentGiven: true` and `consentTimestamp: serverTimestamp()` written to `users/{uid}`

**Test File:** `apps/web/e2e/story-2/consent-firestore-write.spec.ts`
**Framework:** Playwright + Firebase Emulator REST API

**User Flow:**
1. Clear emulator, create user (uid captured), sign in
2. Wait for `/consent`
3. Check checkbox, click submit
4. Wait for navigation to `/profile`
5. Fetch `users/{uid}` document via emulator REST API
6. Assert consentGiven is true
7. Assert consentTimestamp is a valid timestamp (non-null)

**Assertions:**
- `doc.fields['consentGiven'].booleanValue` === `true`
- `doc.fields['consentTimestamp']` has `timestampValue` key (not `nullValue`)

**Implementation note:** `recordConsent()` must use `serverTimestamp()` not `new Date()`. The emulator REST API will return a `timestampValue` string when serverTimestamp resolves.

**Initial Status:** RED

---

### Functional Test FT-5: On Confirm — Navigates to /profile

**Criterion (from story-2.md):** On confirm: navigate to Child Profile Setup (Story 3)

**Test File:** `apps/web/e2e/story-2/consent-navigation.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Clear emulator, create user, sign in
2. Wait for `/consent`
3. Check checkbox
4. Click "I Agree & Continue"
5. Wait for URL change
6. Assert URL is `/profile`
7. Assert `/profile` stub content is visible (Story 3 placeholder)
8. Assert consent modal is no longer visible

**Assertions:**
- `page.url()` contains `/profile`
- `[data-testid="profile-screen"]` is visible
- `[data-testid="consent-modal"]` is not visible

**Initial Status:** RED

---

### Functional Test FT-6: Firestore Write Failure — Error Toast, Modal Stays Open

**Criterion (from story-2.md):** Firestore write failure → error toast, modal stays open, no navigation

**Test File:** `apps/web/e2e/story-2/consent-error-state.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Clear emulator, create user, sign in
2. Wait for `/consent` (all initial reads complete)
3. Intercept Firestore PATCH calls with `page.route()` → return HTTP 500
4. Check checkbox
5. Click "I Agree & Continue"
6. Assert error toast appears
7. Assert URL still `/consent` (modal still open, no navigation)

**Assertions:**
- `[data-testid="consent-error-toast"]` is visible with text "Something went wrong. Please try again."
- `page.url()` contains `/consent`
- `[data-testid="consent-modal"]` still visible

**Route intercept:**
```ts
await page.route('**/databases/(default)/documents/users/**', async (route) => {
  if (route.request().method() === 'PATCH') {
    await route.fulfill({ status: 500, body: '{"error":{"message":"Internal error"}}' })
  } else {
    await route.continue()
  }
})
```

**Note:** Intercept is set up AFTER sign-in and initial user doc reads complete, targeting only the PATCH (updateDoc) from recordConsent. Initial user doc creation uses setDoc (PUT), which is allowed through.

**Initial Status:** RED

---

### Functional Test FT-7: User With consentGiven:true Bypasses /consent

**Criterion (from story-2.md):** User who already consented (consentGiven: true) never sees this modal again

**Test File:** `apps/web/e2e/story-2/consent-already-given.spec.ts`
**Framework:** Playwright

**User Flow:**
1. Clear emulator
2. Create emulator user (uid captured)
3. Seed Firestore user doc with `consentGiven: true`, no child profile
4. Sign in
5. Assert redirected to `/profile` (not `/consent`)
6. Assert consent modal is not visible

**Assertions:**
- `page.url()` contains `/profile`
- `[data-testid="profile-screen"]` is visible
- `[data-testid="consent-modal"]` is not visible

**Initial Status:** RED (routing logic in useAuth already handles this — FT validates it end-to-end)

---

## Track A — Implementation Tasks

### Task 1 of 5: Add `recordConsent()` to authService

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/services/__tests__/authService.test.ts` (modify — add new test)
- Implementation: `apps/web/src/features/auth/services/authService.ts` (modify — add function)

**What to Build:**
- Add `recordConsent(uid: string): Promise<void>` function
- Calls `updateDoc(doc(db, 'users', uid), { consentGiven: true, consentTimestamp: serverTimestamp() })`
- No try/catch here — let the caller handle errors (ConsentModal submit handler will catch)

**Test Requirements:**
- Mock `firebase/firestore`: add `updateDoc` to the existing mock
- Input: `uid = 'test-uid'`
- Assert `updateDoc` called once with correct ref and payload: `{ consentGiven: true, consentTimestamp: <serverTimestamp mock> }`
- Assert `updateDoc` rejects if mocked to reject (propagates error)
- Test description: `"should call updateDoc with consentGiven: true and serverTimestamp"`

**Implementation Notes:**
- Add `updateDoc` to existing `vi.mock('firebase/firestore', ...)` in authService.test.ts
- Import pattern mirrors existing: `const { updateDoc } = await import('firebase/firestore')`
- `serverTimestamp()` mock already returns `{ toDate: () => new Date() }` — keep consistent
- Export the function from authService.ts: `export async function recordConsent(uid: string): Promise<void>`

---

### Task 2 of 5: ConsentModal Component — Structure and Content

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/components/__tests__/ConsentModal.test.tsx` (new)
- Implementation: `apps/web/src/features/auth/components/ConsentModal.tsx` (new)

**What to Build:**
- React component `ConsentModal` with no interactivity yet — pure structure + content
- Elements (all with `data-testid`):
  - `consent-modal` — root overlay div (fixed, full-screen, z-index 100)
  - `consent-card` — inner card div (centred, max-width 480px, background `#FAFAFA`, border-radius 20px)
  - `consent-title` — `<h2>` "Before we begin" (Baloo 2 Bold 22sp, `#1E1B4B`)
  - `consent-body` — body section containing data list + why paragraph
  - `consent-checkbox` — `<input type="checkbox">` (unchecked, no `defaultChecked`, no `checked` prop yet)
  - `consent-privacy-link` — `<a>` "Privacy Policy" (`href="#"`, `target="_blank"`, `rel="noopener noreferrer"`, colour `#9333EA`, underlined)
  - `consent-submit-btn` — `<button>` "I Agree & Continue" (disabled for now — interactivity in Task 3)
- Data list items (exact text per story-2.md §User Flow step 3):
  - "Your name and email (from your Google account)"
  - "Your child's name and date of birth"
  - "How long your child watches each video (watch time data)"
  - "Your device token (to send you notifications, only if you opt in)"
- Why paragraph: "To personalise your child's profile, show you watch time, and notify you about new videos."

**Test Requirements:**
- Use Vitest + React Testing Library
- Render `<ConsentModal />` inside `<MemoryRouter>` (needed for useNavigate in later tasks)
- Mock `useAuthStore` to return `{ user: { uid: 'test-uid' } }`
- Mock `recordConsent` from authService
- Assertions:
  - `getByTestId('consent-title')` has text "Before we begin"
  - `getByTestId('consent-checkbox')` is in the document and not checked
  - `getByTestId('consent-submit-btn')` has text "I Agree & Continue"
  - `getByTestId('consent-privacy-link')` has text "Privacy Policy"
  - Container includes text "Your name and email"
  - Container includes text "watch time data"
  - Container includes text "device token"

**Implementation Notes:**
- Styles inline (consistent with existing components — no CSS modules yet)
- Overlay: `position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'`
- Card: `background: '#FAFAFA', borderRadius: '20px', padding: '32px 24px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto'`
- No `onClick` on the overlay div (non-dismissable by omission)
- No `stopPropagation` needed on card — just omit overlay onClick entirely

---

### Task 3 of 5: Checkbox State + Button Gating

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/components/__tests__/ConsentModal.test.tsx` (modify — add interaction tests)
- Implementation: `apps/web/src/features/auth/components/ConsentModal.tsx` (modify — add state)

**What to Build:**
- Add `const [checked, setChecked] = useState(false)` — explicitly NOT `useState(true)`
- Wire checkbox: `checked={checked}`, `onChange={(e) => setChecked(e.target.checked)}`
- Wire button: `disabled={!checked}`, style switches on `checked`:
  - Active (checked): `backgroundColor: '#F43F5E', color: '#fff', opacity: 1`
  - Disabled (unchecked): `backgroundColor: '#D1D5DB', color: '#fff', opacity: 0.6, cursor: 'not-allowed'`
- Button base style: `height: '48px', borderRadius: '24px', border: 'none', width: '100%', fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: '16px'`

**Edge cases:**
- Checkbox starts unchecked even if component re-renders
- Button disabled attribute must be the HTML `disabled` prop (not just visual styling) so keyboard cannot activate it

**Test Requirements:**
- Extend existing ConsentModal test file
- `"should start with checkbox unchecked and button disabled"`:
  - `getByTestId('consent-checkbox')` is not checked
  - `getByTestId('consent-submit-btn')` has attribute `disabled`
- `"should enable button when checkbox is checked"`:
  - `userEvent.click(getByTestId('consent-checkbox'))`
  - `getByTestId('consent-submit-btn')` does NOT have attribute `disabled`
- `"should disable button when checkbox is unchecked again"`:
  - Check, then uncheck
  - Button disabled again

---

### Task 4 of 5: Submit Handler — recordConsent + Error Toast + Navigation

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/components/__tests__/ConsentModal.test.tsx` (modify — add submit tests)
- Implementation: `apps/web/src/features/auth/components/ConsentModal.tsx` (modify — add handler + toast)

**What to Build:**
- Import `recordConsent` from authService, `useNavigate` from react-router-dom
- Add `const navigate = useNavigate()`
- Add `const [submitting, setSubmitting] = useState(false)`
- Add `const [error, setError] = useState<string | null>(null)`
- Submit handler on button click:
  ```ts
  async function handleSubmit() {
    if (!user || !checked || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await recordConsent(user.uid)
      navigate('/profile')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }
  ```
- Error toast element (only rendered when `error !== null`):
  ```tsx
  {error && (
    <div
      data-testid="consent-error-toast"
      role="alert"
      style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '8px',
               backgroundColor: '#FEE2E2', color: '#991B1B',
               fontFamily: 'Nunito, sans-serif', fontSize: '14px' }}
    >
      {error}
    </div>
  )}
  ```
- Button also disabled while submitting: `disabled={!checked || submitting}`

**Test Requirements:**
- `"should call recordConsent with uid and navigate to /profile on success"`:
  - Mock `recordConsent` resolves
  - Check checkbox, click submit
  - `expect(recordConsent).toHaveBeenCalledWith('test-uid')`
  - Assert `navigate('/profile')` called (use `useNavigate` mock)
- `"should show error toast and stay on consent if recordConsent rejects"`:
  - Mock `recordConsent` rejects with `new Error('network')`
  - Check checkbox, click submit
  - `await findByTestId('consent-error-toast')` — visible
  - Text: "Something went wrong. Please try again."
  - `navigate` NOT called
- `"should not submit if checkbox unchecked"`:
  - Click submit without checking checkbox (button is disabled — click has no effect)
  - `recordConsent` not called

**Implementation Notes:**
- `useNavigate` mock in test: mock `react-router-dom` to return a jest/vitest `vi.fn()` for `useNavigate`
- Pattern:
  ```ts
  const mockNavigate = vi.fn()
  vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))
  ```

---

### Task 5 of 5: Router Wiring + Non-Dismissable Behaviour + Responsive CSS

**Type:** Feature

**Files:**
- Test: `apps/web/src/features/auth/components/__tests__/ConsentModal.test.tsx` (modify — add responsive smoke test)
- Implementation: `apps/web/src/router.tsx` (modify — replace `/consent` stub)
- Implementation: `apps/web/src/index.css` (modify — ensure no body overflow issues at narrow widths)

**What to Build:**

**router.tsx change:**
- Import `ConsentModal` from `./features/auth/components/ConsentModal`
- Replace stub:
  ```tsx
  // Before:
  <div data-testid="consent-modal">Consent (Story 2)</div>
  // After:
  <ConsentModal />
  ```

**Non-dismissable (web):**
- Overlay div: no `onClick` handler (omission = non-dismissable)
- No `keydown` event listener for Escape
- Browser back: AuthGuard's routing loop handles this — while `consentGiven: false`, `resolveRouteTo` returns `'consent'`, AuthGuard redirects back

**Responsive CSS:**
- Modal card: `maxWidth: '480px', width: '90%'` — fits 375px–768px viewports without overflow
- Card `overflowY: 'auto'` — prevents overflow on very small heights
- Body text `fontSize: '15px'`, `lineHeight: '1.5'` — Nunito Regular per design spec
- Checkbox hit target: wrapper div `minHeight: '48px'`, `display: 'flex'`, `alignItems: 'flex-start'`, `gap: '12px'`
- `box-sizing: 'border-box'` on card
- Verify: at 375px viewport, no element creates horizontal scroll

**Test Requirements (unit):**
- `"should not navigate or call recordConsent when backdrop area clicked"`:
  - `userEvent.click(getByTestId('consent-modal'))` (clicking the overlay, not the card)
  - `recordConsent` not called
  - No navigation

---

## Integration Check

- [ ] `vitest run` — all unit tests passing
- [ ] All FT tasks GREEN (`FIREBASE_EMULATOR_RUNNING=1 npx playwright test apps/web/e2e/story-2/`)
- [ ] Acceptance criteria all verifiable:
  - ConsentModal renders at `/consent` for `consentGiven: false` user ✓ (FT-1)
  - Non-dismissable ✓ (FT-2)
  - Checkbox unchecked by default, button gated ✓ (FT-3)
  - Firestore write uses serverTimestamp ✓ (FT-4)
  - Navigation to /profile on confirm ✓ (FT-5)
  - Error toast, modal stays open on write failure ✓ (FT-6)
  - consentGiven:true user skips /consent ✓ (FT-7)

## Story Acceptance

- [ ] Ready for /check
