# Product Note: Choti Ki Duniya — Own Platform

Version: 1.0 | Status: Approved | Date: 2026-03-13

---

## 1. Vision

Choti Ki Duniya is a branded Android app for families with children aged 6 months
to 6 years — a safe, distraction-free home for the channel's educational and
entertainment content, inspired by the "Ms. Rachel" model of warm,
curriculum-aligned early childhood video.

The product exists because YouTube, while essential for discovery, creates a
broken parent experience: no direct relationship, no usage data, no control over
what plays next, and zero brand ownership. This app moves the audience off a
borrowed platform and onto one the creator controls — establishing a direct
channel to families, ownership of engagement data, and the foundation for a
subscription business in 3–6 months.

Videos are embedded from YouTube (free, zero hosting cost) but presented inside
a fully branded, controlled environment. The app's UI wraps the content — parents
and children see Choti Ki Duniya, not YouTube.

Success in 12 months: the app is the primary viewing environment for a meaningful
portion of the existing 6 lakh YouTube subscriber base, parents trust it as the
default safe screen time tool for their child, and the platform generates enough
engagement signal to validate a paid tier.

---

## 2. Target Users

### Primary User — The Parent

**Who:** Mother, 25–35 years old, smartphone-native, typically Indian urban or
semi-urban household. Discovers the channel on YouTube or Facebook.

**Today's workflow:** Opens YouTube, searches for Choti Ki Duniya, hands the
phone to her child. Has no control over what YouTube recommends next, no idea
how long the child watched, and no direct way to know when new content is
available.

**Frustrations:** Inappropriate recommendations appearing after a video ends;
no branded trusted viewing environment; feeling like screen time is uncontrolled.

**What she values most:** Safety (no unwanted content), simplicity (one tap to
start a video), and insight (knowing how long her child watched today).

**Frequency of use:** Daily — she sets up and monitors; her child watches.

---

### Secondary User — The Child (4–6 years)

**Who:** Pre-schooler who can operate a touchscreen independently with light
parental supervision.

**Experience:** Browses the video grid, taps a thumbnail to play, taps replay or
selects another video. Navigation is icon-driven, no reading required — large
colourful thumbnails, big touch targets.

**Note on younger children (under ~3 years):** No special UI mode is built for
toddlers. The parent operates the app on the toddler's behalf — selects and
plays videos directly. The single interactive UX serves both cases: parents use
it for toddlers; older children use it independently.

---

## 3. Market & Competitive Context

**Alternatives parents use today:**
- YouTube (default — zero safety controls, no branded experience)
- YouTube Kids (safer but generic, no Choti Ki Duniya-specific curation,
  recommendations lead to other channels)
- Kidloland, LooLoo Kids apps (category competitors — generic content, not
  Indian-language or regionally relevant)

**Where they fall short:** None offer a dedicated, branded experience tied
specifically to this creator's content and relationship with Indian families.
YouTube Kids still surfaces recommendations to other channels.

**Key differentiator:** The only app that is exclusively Choti Ki Duniya — the
brand, the voice, the curriculum parents already trust — with a parent control
layer and zero leakage to other content.

---

## 4. Features

### Feature 1: Authentication

**Description:** Parent signs in using Google (Gmail) — single tap, no
password creation required. Firebase Authentication handles sign-in.

**User value:** A parent can be inside the app in under 60 seconds. Eliminates
the most common onboarding drop-off point.

**Key interactions:** App launch → "Sign in with Google" → consent screen →
home screen. Returning users are auto-authenticated.

**Priority:** Must Have

---

### Feature 2: Child Profile

**Description:** After sign-in, parent adds the child's name and date of birth.
One account supports multiple child profiles (data model future-proofed from
day one; multi-profile switcher UI is V1.1).

**User value:** Enables per-child watch time tracking. Gives the experience a
personal, trusted feel.

**Key interactions:** First-time setup flow → add child name + DOB → profile
saved → library opens.

**Priority:** Must Have

---

### Feature 3: Video Library

**Description:** A browsable grid of all available videos, embedded from YouTube
using the YouTube iFrame Player API. Videos are tagged with categories (Rhymes,
Colours, Numbers, etc.) — category filtering is built into the data model from
day one.

**User value:** One safe place, all the content, no YouTube ads, no
recommendations to other channels. The library grows and the experience stays
consistent.

**Key interactions:** Parent or child sees the grid → taps a thumbnail → video
plays full-screen inside the app → at end, returns to grid or auto-advances to
next video.

**YouTube embed configuration (must be implemented exactly):**
- `rel=0` — end-of-video recommendations show only this channel's videos
- `modestbranding=1` — minimal YouTube logo
- `controls=0` — app builds its own play/pause/back UI
- Videos are **unlisted** on YouTube (not publicly searchable, fully embeddable)
- Monetisation disabled on embedded videos to prevent ads appearing in-app

**Priority:** Must Have

**Notes:** Launching with ~10 videos. 1–2 new videos added per week. Category
filtering becomes visible in UI once library exceeds ~20 videos.

---

### Feature 4: Watch Time Dashboard (Parent)

**Description:** A parent-facing screen showing how long the child watched
today, this week, and this month — displayed as simple numbers and a bar chart.

**User value:** Genuine visibility into screen time without a third-party
parental control app. Supports informed, guilt-free screen time decisions.

**Key interactions:** Parent taps "Dashboard" from home → sees daily / weekly /
monthly totals for the active child profile.

**Per-video breakdown** (V1.1 — not V1): which specific videos were watched and
for how long.

**Priority:** Must Have (aggregate totals in V1); Should Have (per-video in V1.1)

**Watch time tracking implementation:**
Watch time is tracked by polling the YouTube iFrame Player API every 10 seconds
using `player.getCurrentTime()`. On each tick, the app logs the delta (seconds
watched since last tick). On pause or end, the final position is recorded.

Each watch session is stored in Firestore:
```
watchSessions/
  { childProfileId, youtubeVideoId,
    videoDurationSeconds,   ← total video length
    watchedSeconds,         ← actual seconds watched (not total elapsed)
    completionPercent,      ← watchedSeconds / videoDurationSeconds
    startTime, endTime }
```

10-second polling gives ±10 second accuracy — sufficient for a parent dashboard.
This Firestore log also serves as the app's analytics layer (replaces Firebase
Analytics — see Section 8).

---

### Feature 5: Push Notifications

**Description:** When a new video is published, parents who have opted in
receive a push notification: "New rhyme added — check it out!"

**User value:** Drives re-engagement without requiring parents to remember to
open the app. Directly supports weekly upload cadence.

**Key interactions:** Creator publishes video + triggers FCM notification →
opted-in parents receive notification → tap opens app to new video.

**Priority:** Must Have

**Compliance note:** Opt-in / opt-out controls are required for Google Play
submission. See Section 6 for full compliance details.

---

## 5. Out of Scope — V1

- **iOS app:** Android only for V1. iOS is a future release.
- **Subscription / paywall:** Content is free in V1. Monetisation is V2
  (3–6 months post-launch).
- **Multiple child profiles in the UI:** Data model supports it; UI switcher
  is V1.1.
- **Per-video watch analytics:** Aggregate totals only in V1; per-video
  breakdown is V1.1.
- **Offline / downloaded playback:** Requires internet. No download feature.
- **Screen time limits or locks:** Parents can see time but cannot set limits.
- **Community features:** No comments, ratings, or UGC of any kind.
- **Self-hosted video:** Videos are YouTube-embedded in V1. Self-hosting on a
  CDN (Cloudflare Stream or equivalent) is a V2 consideration when subscription
  revenue can support the cost (~$900–9,000/month at scale).
- **Web app:** Mobile-first Android only.

---

## 6. Constraints

**Timeline:** No hard external deadline. Internal goal: MVP in 8 weeks.

**Budget:** Not formally defined. YouTube embedding means zero video hosting
cost in V1. Primary cost is development.

**Platform:** Android only (React Native). Google Play Store submission.

**Team:** Small / early-stage. Technical complexity must remain low.

**Existing systems:** Creator's library lives on YouTube. Videos remain on
YouTube as unlisted; no migration required.

---

### Compliance — Google Play Families Policy (MANDATORY)

> **This section must be cascaded to /architecture, /design, and /sprint.**
> Every item below is a hard requirement — non-compliance risks app rejection
> or removal from the Play Store after launch.

**1. App must be designated as targeting children**
The app must be submitted under Google Play's Families programme or declared
as "Designed for Families". This triggers stricter review.

**2. Permitted SDKs only**
Google maintains an approved SDK list for child-directed apps. The following
are compliant and approved for V1:
- Firebase Authentication — approved
- Cloud Firestore — approved
- Firebase Cloud Messaging (FCM) — approved
- YouTube iFrame Player API — approved

The following must NOT be used in child-directed contexts:
- Firebase Analytics / Google Analytics — NOT approved without child-directed
  mode enabled. When enabled, most analytics features are disabled. Decision
  required: use a compliant alternative (e.g. custom event logging to Firestore)
  or disable analytics entirely in V1.
- Crashlytics — not on the approved list; evaluate whether to include.
- Any advertising SDK — prohibited.
- Any third-party tracking or attribution SDK (AppsFlyer, Adjust, etc.) — prohibited.

**3. No behavioural advertising**
Zero ads of any kind inside the app. YouTube videos must have monetisation
disabled to prevent pre-roll / mid-roll ads appearing inside the embedded player.

**4. Data collection — minimum necessary**
Only collect what is strictly required:
- Email address (from Google Sign-In, for account identity)
- Child name and date of birth (for profile and watch time tracking)
- Watch session data (start time, end time, video ID)
- FCM token (for push notifications)

Do NOT collect: device advertising ID, precise location, contacts, or any
data not listed above. This must be enforced at the architecture level.

**5. Privacy Policy**
A privacy policy must be:
- Written before app submission
- Clearly state what data is collected, how it is used, and how it is stored
- Linked in the Google Play Console listing
- Accessible from within the app (link in the settings or onboarding screen)
- Compliant with India's Digital Personal Data Protection Act (DPDP Act, 2023),
  which requires verifiable parental consent before processing a child's
  personal data

**6. DPDP Act (India) — Parental Consent**
Under India's DPDP Act, processing personal data of children (under 18) requires
verifiable parental consent. In practice for V1:
- The parent (adult) creates the account and sets up the child profile
- The consent flow at sign-up must explicitly state what data is collected
  and why
- A checkbox consent (not pre-checked) must be presented and recorded
- Architecture must log that consent was given, with a timestamp

**7. No external links from child-facing screens**
No hyperlinks, "visit our website" buttons, or any navigation that could
take a child out of the app. This applies to all screens visible during
a child's session.

**8. Content rating**
The app must be rated PEGI 3 (or equivalent Google Play content rating for
children's apps) in the Play Console content rating questionnaire.

---

## 7. Success Metrics

Business case validation is the primary goal for V1. Specific numeric targets
are not yet defined — see Open Questions.

Metrics to instrument from day one:
- App installs (Google Play Console)
- Daily Active Users (DAU) and Weekly Active Users (WAU)
- Average session length per child per day
- Push notification opt-in rate
- D7 and D30 retention
- Weekly video play count and completion rate (via watch session logs)

---

## 8. Open Questions

| Question | Owner | Resolve By |
|---|---|---|
| What install / DAU number validates the business case for a paid tier? | Founder | Before V1.1 planning |
| ~~Use Firebase Analytics~~ — **Decided:** Custom Firestore watch session logging replaces Firebase Analytics. No Firebase Analytics SDK included. | Tech Lead | Closed |
| Include Crashlytics in V1? (Not on Google's approved child-directed SDK list) | Tech Lead | Week 1 |
| Watch time tracked per child profile or per device? | Product | Week 1 |
| Who writes the Privacy Policy and DPDP-compliant consent flow? | Founder / Legal | Week 2 |

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Google Play rejection — non-compliant SDK (e.g. Firebase Analytics) | High if ignored | Audit all SDKs against the Families Policy approved list before writing a single line of code. Remove or replace any non-compliant SDK. |
| Google Play rejection — missing or inadequate Privacy Policy | High if ignored | Engage legal / compliance to draft the policy before submission. Must cover DPDP Act and Play Store requirements. |
| DPDP Act violation — collecting child data without verifiable parental consent | Medium | Implement explicit consent checkbox at sign-up; log consent with timestamp in Firestore. |
| YouTube changes embed API or restricts unlisted video embedding | Low | Monitor YouTube Developer terms; self-hosting is the fallback in V2. |
| Low conversion from YouTube to app | Medium | Strong in-video CTA; App Store listing must clearly communicate "safe, no ads, no other channels". |
| Auto-advancing videos in parent-managed sessions causes unintended long sessions | Low | Surface daily watch time prominently on parent dashboard; soft nudge in V1.1. |

---

## 10. Assumptions

- Parents loyal to the YouTube channel will download a dedicated app if the
  value proposition (safe, branded, no unwanted recommendations) is clearly
  communicated. *If wrong: downloads will be low despite the existing following.*

- YouTube's `rel=0` parameter reliably limits end-of-video recommendations to
  this channel only. *If wrong: other channels' content appears, undermining the
  safety proposition — triggers early move to self-hosting.*

- 1–2 new videos per week is sufficient upload cadence to sustain push
  notification engagement. *If wrong: parents stop opening notifications —
  may need supplementary content formats or reduced notification frequency.*

- The creator / team is comfortable with YouTube remaining the source of truth
  for video content in V1, including keeping videos as unlisted.
  *If wrong: self-hosting becomes a V1 requirement, significantly increasing cost.*

- Firebase Authentication and Firestore are compliant with the Google Play
  Families Policy for child-directed apps. *If wrong: requires alternative
  auth/database approach — significant re-architecture.*

---

> **Cascade instruction for downstream documents:**
> Section 6 (Compliance) must be referenced explicitly by:
> - `/architecture` — SDK selection, data model, consent logging
> - `/design` — no external links on child-facing screens, consent checkbox UX,
>   privacy policy link placement
> - `/sprint` — compliance tasks must appear as explicit stories, not
>   assumptions. Privacy Policy, consent flow, and SDK audit are not optional
>   and must be scheduled before app submission stories.

---

*Note for /sprint: Section 4 (Features) is the direct source for user story
generation. Each feature maps to one or more stories. Priority fields map to
sprint ordering. Section 5 (Out of Scope) is used to reject stories that creep
in during planning.*
