# Design: Choti Ki Duniya — Own Platform

Version: 1.0 | Status: Approved | Date: 2026-03-16

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.1 | 2026-03-13 | Initial draft from product_note.md + architecture.md | Draft |
| 1.0 | 2026-03-16 | Approved by founder | Approved |

---

## 1. UX Principles

1. **Parent sets up, child watches.** Every screen belongs to one of two
   contexts — parent or child. Never mix them. A parent screen feels like a
   control panel. A child screen feels like a toy.

2. **A child cannot break it.** On child-facing screens, every tap does
   something intentional. There are no accidental exits, no menus that lead
   nowhere, no UI a toddler can disrupt. Large tap targets, forgiving hit areas,
   no swipe-to-go-back on the player.

3. **The parent is always one tap away from control.** No matter what the child
   is watching, the parent can access the dashboard and settings in one tap via
   a persistent, discreet parent icon. It is visible but not prominent enough
   for a child to fixate on.

4. **Zero learning curve.** A parent who has never seen the app signs in,
   sets up their child's profile, and starts a video in under 60 seconds —
   without reading instructions. Every step has a single clear action.

5. **Warm and trusted, not loud and gamified.** The aesthetic is calm,
   nurturing, and premium — not frantic like a games app. Colours are vibrant
   but harmonious. There are no streaks, badges, scores, or addictive
   engagement mechanics. This is a safe place, not a casino for children.

6. **Sensitive settings require proof of a parent.** Any action that changes
   app behaviour — notifications, future screen time limits, subscription
   management — must pass a Parental Gate before proceeding. The gate is a
   simple cognitive challenge a young child cannot solve: a single-digit
   addition or subtraction question (e.g. "What is 4 + 7?"), randomly
   generated on each attempt. Dashboard (read-only watch time data) does
   NOT require a gate — parents check this frequently and it presents no
   risk. Settings changes DO require it. This aligns with Google Play
   Families Policy recommendations for child-directed apps.

---

## 2. User Mental Model

**The parent's mental model:** "This is my child's TV channel — but I control
the remote." They expect to open the app, see videos, tap one, and hand the
phone to their child. Returning visits: open → child watches → check how long.

**The child's mental model:** "This is where my rhymes live." They see
thumbnails of videos they recognise, tap them, and watch. No reading required.
Navigation is visual and tactile.

**The single most important action in the product:** Tapping a video thumbnail
and having it play immediately, full-screen, with no ads or interruptions.

**Real-world metaphor the UI leans on:**
- For the parent: a curated TV guide (not a social feed, not a store)
- For the child: a picture book where every picture plays a song

---

## 3. Information Architecture

### Screen Map

```
App
├── [AUTH STACK — parent context]
│   ├── Sign In
│   ├── Consent Modal (DPDP Act — mandatory, non-dismissable)
│   └── Child Profile Setup
│
├── [MAIN — child context by default]
│   ├── Video Library          ← default screen after auth
│   │   └── [Parent Icon ↗]   ← discreet, top-right
│   └── Video Player           ← full-screen, no bottom bar
│
└── [PARENT PANEL — Parental Gate required on every access]
    ├── Dashboard              ← watch time (today / week / month)
    └── Settings
        ├── Notification toggle
        └── Privacy Policy link (opens external browser)
```

### Navigation Pattern

**Child-facing default:** The Video Library is the home screen. No bottom tab
bar on child-facing screens — it creates navigation noise for children and
risks accidental taps.

**Parent access:** A circular parent avatar / lock icon (32dp) sits in the
top-right corner of the Video Library screen. Tapping it opens a bottom sheet
that slides up — revealing Dashboard and Settings. This keeps the parent layer
completely out of the child's visual field during normal use.

**Player:** Navigated to via push (full-screen). Back button returns to Library.
Swipe-to-go-back is disabled on the player to prevent accidental dismissal
by a child.

**Modal vs push navigation:**
- Consent, profile setup, notification prompts → Modal (over existing screen)
- Video Player → Push (full-screen stack)
- Parent Panel (Dashboard, Settings) → Bottom sheet sliding up over Library

---

## 4. Core User Flows

### Flow 1: First-Time Onboarding

**Trigger:** Parent downloads app and opens it for the first time.

1. **Sign In screen** → tap "Continue with Google" → Google sign-in sheet
   appears → parent selects Google account → returns to app
2. **Consent Modal** (non-dismissable) → lists what data is collected
   and why → parent ticks unchecked checkbox → taps "I Agree & Continue"
   → consent recorded to Firestore with timestamp
3. **Child Profile Setup** → parent enters child's name → selects age
   range (Under 3 / 3–4 / 5–6) → taps "Start Watching"
4. **Video Library** → first-time empty state if no videos yet (shows
   "Coming soon" message) or full grid of videos

**Success state:** Parent sees the video grid, hands phone to child.
**Error state:** Google Sign-In fails → inline error "Sign in failed. Try again."
with retry button. No crash, no blank screen.

---

### Flow 2: Child Watches a Video

**Trigger:** Child or parent taps a video thumbnail on the Library screen.

1. **Video Library** → tap thumbnail → Player screen pushes in
2. **Player screen** → video loads and auto-plays full-screen → custom
   play/pause button visible at bottom → watch session begins in memory
3. **Video ends** → watch session written to Firestore → auto-advance to
   next video in library (loops back to first if at end)
4. **Child taps back / parent taps back button** → player dismissed →
   returns to Library → session written to Firestore

**Success state:** Video plays without interruption, no ads, no external links.
**Error state:** Video fails to load (network issue) → friendly illustrated
error state: "Oops! Check your internet connection." with a retry button.

---

### Flow 3: Parent Checks Watch Time

**Trigger:** Parent wants to see how long their child watched today.

1. **Video Library** → parent taps parent icon (top-right) →
   Parent Panel bottom sheet slides up
2. **Dashboard tab** → shows today's total watch time prominently,
   bar chart for the week, month total below
3. Parent reads the data → taps anywhere outside the sheet or
   swipes down to dismiss → returns to Library

**Success state:** Parent sees clear, readable numbers. No confusion about
units (always displayed as "X hr Y min" or "Y min").
**Error state:** No sessions yet → empty state: "No watch time recorded yet.
Start a video to begin tracking."

---

### Flow 4: Parent Receives and Acts on Push Notification

**Trigger:** New video added; parent receives push notification.

1. Notification arrives: "New rhyme added — check it out! 🎵"
2. Parent taps notification → app opens directly to Video Library →
   new video appears at top of grid (sorted by publishedAt desc)
3. Parent taps new video → plays

**Success state:** Seamless deep-link from notification to the new video.
**Error state:** App not installed / notification dismissed → no action needed.

---

### Flow 5: Admin Publishes a Video

**Trigger:** Creator uploads a new video to YouTube (unlisted), wants to
add it to the app.

1. Admin navigates to `/admin` (web app, protected)
2. Sees video list + "Add Video" button → taps "Add Video"
3. Form: YouTube Video ID, Title, Category (dropdown), Duration (minutes:seconds),
   Thumbnail URL (auto-populated from YouTube ID or custom)
4. Taps "Publish" → video appears in Firestore → immediately visible in app
5. Admin optionally taps "Send Notification" → writes to notifications
   collection → Cloud Function sends FCM to all opted-in users

**Success state:** Video appears in app within seconds of publishing.
**Error state:** Invalid YouTube ID → inline validation error before submit.

---

## 5. Visual Direction

**Tone:** Warm, joyful, trustworthy. Not loud. Not gamified.

**Personality:** Nurturing · Playful · Safe

**Inspiration:**
- **YouTube Kids** — large thumbnail grid, saturated colours, child-legible
  layout. We take the layout approach but make it more premium and less busy.
- **Duolingo** — rounded corners, friendly illustration style, warm colour
  palette. We take the warmth and roundness.
- **Ms. Rachel's visual identity** — soft purples and yellows, warm and
  educational. We take the colour harmony and the sense of calm trust.

**Layout density:** Spacious. Children need large tap targets. Parents need
clarity at a glance. Never pack more onto a screen than necessary.

**Typography approach:** Expressive for headings (rounded, friendly),
functional for body text (highly legible, generous line-height).
Font: **Nunito** — rounded letterforms, high legibility at large sizes,
free via Google Fonts, works beautifully for a children's product.

**The face of the brand:** The creator's face is the primary trust and
recognition signal — for parents who follow the channel and for children
who associate her with the content they love. Her photo must appear
prominently in the app, not just as a logo treatment.

Required placements:
- **Sign In screen:** Large circular creator photo (120dp) as the hero,
  with a gold/gradient ring border. The visual message: "You're entering
  my world."
- **Video Library header:** Small circular avatar (40dp) alongside the
  app name — a persistent "host" presence on the main screen.
- **Push notifications:** Creator photo as the notification icon.
- **Empty states:** Creator illustration or photo with a warm message.

Asset required for production: hi-res circular-crop photo of the creator
on a transparent or brand-coloured background.
Placeholder: `Reference Assets/channels4_profile.jpg` used in prototype.

**Imagery:** Video thumbnails are the primary content visual. Creator photo
is the primary brand visual. Custom illustrations used for empty states only.
No stock photography.

---

## 6. Design System

> Colours derived from brand reference assets (YouTube banner + content thumbnail).
> The brand is purple-primary with coral-red accents and hot pink highlights.

**Primary colour:** `#9333EA` (brand purple) — CTAs, active states, key actions,
header backgrounds. Directly matches the centre of the brand gradient.

**Primary light:** `#F3E8FF` — card backgrounds, chips, subtle highlights.

**Primary dark:** `#6B21A8` — pressed states, text on light backgrounds.

**Accent / CTA:** `#F43F5E` (coral-red) — primary action buttons (Sign In,
Publish, Send Notification), notification badges. Matches the brand's
Subscribe button and blob accent colour.

**Secondary accent:** `#EC4899` (hot pink) — secondary highlights, active
category chips. Matches the right-side brand gradient.

**Header / hero gradient:** `linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)`
Used on the app header, onboarding screens, and the player top bar.
Organic blob shapes (SVG, brand-derived) used as background decoration on
key screens.

**Surface / background:** `#FAFAFA` — near-white, clean.

**Child screen background:** `#F3E8FF` — very light purple. Visually signals
the child-facing context without a hard mode switch.

**Text primary:** `#1E1B4B` (deep warm indigo — pairs with purple brand)
**Text secondary:** `#6B7280` (neutral grey)

**Error:** `#EF4444` | **Warning:** `#F59E0B` | **Success:** `#22C55E`

**Font family:** **Baloo 2** (Google Fonts) — matches the rounded, bubbly
energy of the brand logo letterforms. Used for all display and heading text.
**Nunito** (Google Fonts) — used for body text and UI labels where legibility
at small sizes matters more than personality.

| Role | Font | Weight |
|---|---|---|
| App logo / hero text | Baloo 2 | ExtraBold 800 |
| Screen headings | Baloo 2 | Bold 700 |
| Card titles, section labels | Baloo 2 | SemiBold 600 |
| Body text, descriptions | Nunito | Regular 400 |
| Buttons, chips, captions | Nunito | SemiBold 600 |

**Type scale:**
- Display / hero (onboarding): 28sp Baloo 2 ExtraBold
- Screen heading: 22sp Baloo 2 Bold
- Card title (video grid): 15sp Baloo 2 SemiBold
- Body: 15sp Nunito Regular
- Caption / labels: 13sp Nunito SemiBold
- Minimum font size anywhere: 13sp

**Base spacing unit:** 8dp grid. All spacing, padding, and margins are
multiples of 8dp (8, 16, 24, 32, 48).

**Border radius:**
- Cards / thumbnails: 16dp (friendly, rounded)
- Buttons: 24dp (pill — matches brand's rounded CTA style)
- Bottom sheets: 24dp top corners
- Chips / tags: 20dp (pill)
- Parental Gate modal: 20dp

**Elevation / shadow:** Subtle. Cards use a soft purple-tinted shadow
(`rgba(147, 51, 234, 0.12)`, 4dp blur). No harsh grey shadows anywhere.
Player controls overlay video directly — no shadow.

---

## 7. Interaction Patterns

**Button hierarchy:**
- Primary: filled violet (`#7C3AED`), white label, 48dp height minimum
- Secondary: outlined violet, violet label
- Ghost: no border, violet label — used for low-emphasis actions
- Destructive: filled red — not used in V1 (no delete flows)

**Form patterns:**
- Inline validation on blur (not on every keystroke)
- Required fields marked with a subtle asterisk
- Child Profile Setup: name field is the only free-text input — large,
  friendly input with a placeholder ("e.g. Arjun")

**Empty states:**
- Video Library (no videos yet): illustration + "Videos coming soon!"
- Dashboard (no sessions): illustration + "Start watching to see your stats"
- Every empty state has an illustration (warm, on-brand) — never just text

**Loading states:**
- Video thumbnails: shimmer skeleton cards (same grid shape as loaded cards)
- Dashboard data: shimmer skeleton bars
- Never a standalone full-screen spinner — always skeleton in context

**Error states:**
- Network error: full-screen friendly illustration + "Check your connection"
  + Retry button (replaces content area, not a modal)
- Video load failure: same pattern within the player area
- Form errors: inline below the field in red, 13sp

**Feedback:**
- Successful actions (profile saved, notification sent): bottom toast,
  3 seconds, success green, slides up from bottom
- Taps on video thumbnails: immediate scale-down animation (0.95 scale,
  100ms) as tactile feedback before navigation

**Gestures (mobile):**
- Pull-to-refresh: supported on Video Library screen
- Swipe-to-go-back: **disabled on Video Player** (child safety)
- Swipe down to dismiss: bottom sheet (Parent Panel)
- Long press: not used in V1

**Parental Gate:**
Shown as a modal overlay before accessing either parent-facing screen.
Randomly generates a single-digit addition or subtraction question
(e.g. "What is 3 + 8?"). Numeric keypad input. No lockout on failed
attempts — wrong answer simply resets with a new question. On correct
answer: proceeds. On dismiss (tap outside or back): returns to Library.

Screens / actions that require the Parental Gate:
- Entering the Dashboard (watch time data)
- Entering the Settings screen
- Toggling push notifications on/off
- (V2) Any subscription or payment flow
- (V2) Screen time limit changes

Every access to the Parent Panel requires the gate — the parent taps
the parent icon → gate appears immediately → on pass → panel opens.
This keeps the full parent layer consistently protected.

---

## 8. Accessibility

**Contrast ratio:** Minimum 4.5:1 for all body text. Large text (18sp+)
minimum 3:1. Violet `#7C3AED` on white meets AA at all sizes.

**Touch target minimum size:** 48×48dp on all interactive elements.
Video thumbnail cards are naturally large (full grid width ÷ 2 columns).
Parent icon in top-right: 44×44dp tappable hit area even if visual is smaller.

**Screen reader support:** Semantic labels on all interactive elements.
Video thumbnails labelled with title. Player controls labelled
("Play", "Pause", "Back to library"). Required for Play Store submission.

**Font scaling (Android):** Supported — layout must not break at 150%
font scale. Test at 150% before each Play Store submission.

**Child-facing screen accessibility note:** Screen reader on child-facing
screens may interfere with the child's experience — this is acceptable.
Accessibility is for the parent, not the child, on setup and dashboard screens.

---

## 9. Responsive / Adaptive Rules

**Mobile (Android, primary):**
- Video grid: 2 columns, 8dp gutter, 16dp outer padding
- Thumbnail aspect ratio: 16:9
- Cards: title below thumbnail, category chip overlaid bottom-left of thumbnail

**Mobile Web (mobile browser, secondary):**
- Same 2-column grid
- Bottom navigation replaced by top navigation bar
- Parent Panel: replaces bottom sheet with a side drawer on web

**Tablet (not supported in V1):**
Grid would expand to 3 columns — data model and component props support
this without code changes.

**Desktop Web (admin panel only):**
- Admin panel is desktop-first
- Standard sidebar + content layout
- No child-facing screens rendered at desktop widths

**Breakpoints (web):**
- `< 480px` — mobile single column stack (rare, very small phones)
- `480px – 768px` — mobile, 2-column grid
- `> 768px` — desktop, admin panel layout only

---

## 10. Open Design Decisions

| Decision | Options | Owner | Resolve by |
|---|---|---|---|
| Brand colours — are violet/amber aligned with CKD's existing brand identity? | Confirm with founder or adjust to match | Founder | Before prototype approval |
| Parent Panel access — bottom sheet vs separate tab | Bottom sheet (current proposal) vs bottom tab bar | Review in prototype | Prototype review |
| Category filter UI — horizontal chips or dropdown | Horizontal scrollable chips (current) vs dropdown | Review in prototype | Prototype review |
| Auto-advance between videos — on by default or off? | On by default (current) vs parent toggle | Founder | Before V1.1 |
| Notification permission prompt timing — on first launch or after first video watched? | After first video (less friction, more context) vs on launch | Review in prototype | Prototype review |
