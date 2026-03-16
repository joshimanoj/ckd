# Story 6: Admin Panel — Video Management

**Current Pass: 1 — Web** | No Native App pass (web-only story)

**Status:** Not Started | **Sprint:** 2 | **Type:** UI story — /uat required after /check

---

### User Story

As the creator / admin
I want to add, edit, and manage videos through a protected web panel
So that new content appears in the app immediately after I publish it on YouTube

---

### Context

The Video Library (Story 5) can only show videos that exist in Firestore. Without the Admin Panel, there is no way to add videos to the app short of writing directly to Firestore. The admin panel is a protected route on the web app (`/admin`) — accessible only to users with a Firebase custom claim of `admin: true`. It shows the video list, an "Add Video" form, a notification trigger panel, and toggle controls for hiding/showing videos.

This story also enables the push notification send trigger (used in Story 9 for the FCM flow) — the admin writes a document to the `notifications` collection, which triggers the Cloud Function.

---

### Problem Statement

**Current State:** No interface for the creator to publish videos to the app.

**Pain Points:**
- Without admin panel, adding a video requires direct Firestore console access — not creator-friendly
- Creator needs to publish video and optionally notify parents in one workflow
- Admin must be able to hide a video without deleting it (e.g. seasonal or incorrect upload)

**Desired State:** Creator opens `/admin`, sees their video library, taps "Add Video", fills a short form with the YouTube Video ID, title, category, and duration, taps "Publish", and the video immediately appears in the app. Optionally sends a push notification from the same screen.

---

### User Flow

**Trigger:** Creator navigates to `/admin` in a browser (web app).

**Access Control:**
1. Route is protected — `onAuthStateChanged` + check for Firebase custom claim `admin: true`
2. If not admin → redirect to home page (or show "Access denied" screen)
3. Admin claim is set manually via Firebase Admin SDK CLI (one-time setup in Sprint 0)

**Add Video flow:**
1. Admin taps "Add Video" button → VideoForm modal/slide-over opens
2. Form fields:
   - YouTube Video ID (text, required) — e.g. `dQw4w9WgXcQ`
   - Title (text, required, max 80 chars)
   - Category (dropdown: Rhymes / Colours / Numbers / Animals / Stories)
   - Duration (mm:ss input, required) — entered manually by admin
   - Thumbnail URL (text, auto-populated: `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`) — editable if custom thumbnail needed
   - Order (number, optional — defaults to current max + 1 within category)
3. YouTube Video ID field: on blur, auto-populates thumbnail URL and attempts to show a preview thumbnail image inline
4. Taps "Publish":
   - Validates all required fields
   - Writes document to `videos/{autoId}` with `isActive: true`, `publishedAt: serverTimestamp()`
   - Shows success toast: "Video published successfully"
   - Closes form, list refreshes

**Video list view:**
- Table/list of all videos (active and inactive) — title, category, publishedAt, isActive toggle
- `isActive` toggle per row — flips `isActive` field in Firestore (soft hide/show)
- No delete — use `isActive: false` to hide

**Send Notification panel:**
1. Below video list: "Send Notification" section
2. Fields: Title (pre-filled "New rhyme added!"), Body text, optional link to specific video (YouTube Video ID)
3. Taps "Send" → writes document to `notifications/{autoId}` → Cloud Function picks it up → FCM sent to opted-in users
4. Status updates in real-time: "Sending..." → "Sent to [N] devices" (status field polled from Firestore)

**Alternatives / Error States:**
- Invalid YouTube Video ID → thumbnail preview fails to load → inline warning "Check your YouTube Video ID"
- Firestore write fails → error toast, form stays open
- Admin access without internet → offline state on admin page

---

### Acceptance Criteria

**Functional:**
- [ ] `/admin` route requires Firebase custom claim `admin: true` — unauthenticated or non-admin users are redirected
- [ ] Video list shows all videos (active and inactive) ordered by `publishedAt DESC`
- [ ] "Add Video" form validates: YouTube ID, title, category, duration required
- [ ] Thumbnail URL auto-populated from YouTube ID (standard thumbnail URL pattern)
- [ ] Successful publish → `videos` collection updated → success toast → list refreshes
- [ ] `isActive` toggle in list immediately updates Firestore — change reflected in app on next fetch
- [ ] "Send Notification" writes to `notifications` collection with correct fields
- [ ] Notification status (`pending` / `sent` / `failed`) visible in admin panel (real-time listener)

**Non-Functional:**
- [ ] Admin panel is desktop-first (> 768px breakpoint) — sidebar + content layout
- [ ] Form validation fires on blur, not on keystroke
- [ ] "Publish" button disabled while Firestore write is in progress (prevents double-submit)
- [ ] Admin panel not accessible from mobile app navigation (web only, desktop route)

**Edge Cases:**
- [ ] Non-admin authenticated user hits `/admin` → redirect to `/` with no error exposed
- [ ] Duplicate YouTube Video ID → no Firestore constraint (not enforced in V1; admin responsible)
- [ ] Duration entered in wrong format → validate mm:ss pattern, show inline error

---

### Design References

**Mockups:** No HTML prototype — reference Design.md Sections 4 (Flow 5 — Admin Publishes Video), 9 (Responsive/Adaptive Rules — Desktop Admin)

**Key UI Elements (desktop layout):**
- Sidebar: `#1E1B4B` dark indigo background, white navigation links
- Content area: `#FAFAFA` background, standard card layout
- "Add Video" button: coral-red `#F43F5E`, pill, 44dp height
- VideoForm: slide-over panel (right side), 480px wide, `#FAFAFA` background
- Form inputs: standard text field, 16dp border-radius, `#9333EA` focus ring
- Category dropdown: styled select, brand colours
- isActive toggle: Android-style toggle switch, `#9333EA` when on
- Notification panel: distinct card section below video list, `#F3E8FF` background tint

**Visual Requirements:**
- Admin panel purposely more functional/dense than consumer UI — this is a desktop tool
- No child-facing design elements (no Baloo 2 extra-bold, no rounded child aesthetic)
- Standard admin dashboard visual density acceptable

---

### Technical Notes

**Files Affected:**
- `apps/web/src/features/admin/components/VideoForm.tsx` (new)
- `apps/web/src/features/admin/components/VideoList.tsx` (new)
- `apps/web/src/features/admin/components/NotificationPanel.tsx` (new)
- `apps/web/src/features/admin/hooks/useAdmin.ts` (new)
- `apps/web/src/features/admin/services/adminService.ts` (new)
- `apps/web/src/pages/admin/AdminPage.tsx` (new)
- `apps/web/src/router.tsx` (add `/admin` protected route)
- `packages/shared/src/types/video.ts` (Video interface)
- `packages/shared/src/firebase/collections.ts` (videos, notifications collection refs)

**Dependencies:**
- Sprint 0 must include setting Firebase custom claim `admin: true` on the creator's account (one-time Firebase Admin SDK CLI command)
- Story 9 (Push Notifications) depends on the `notifications` collection write from this story's Notification Panel

**API Contracts (Firebase):**
```ts
// Add video
addDoc(collection(db, 'videos'), {
  youtubeVideoId, title, category, thumbnailUrl,
  durationSeconds, publishedAt: serverTimestamp(),
  isActive: true, order: maxOrderInCategory + 1
})

// Toggle isActive
updateDoc(doc(db, 'videos', videoId), { isActive: !currentIsActive })

// Send notification
addDoc(collection(db, 'notifications'), {
  title, body, youtubeVideoId: videoId || null,
  createdAt: serverTimestamp(), sentAt: null, status: 'pending'
})

// Real-time notification status listener
onSnapshot(doc(db, 'notifications', notificationId), callback)
```

**Security rules (already defined in architecture.md):**
- `videos` write: admin custom claim required
- `notifications` write: admin custom claim required

---

### Complexity & Effort

**Score:** 3 (2–3 days)
**Estimated Tasks:** ~10 atomic tasks
**Risk Factors:**
- Firebase custom claim verification on the client: `getIdTokenResult(user, forceRefresh: true)` must be called to read claims — ensure forceRefresh is used after claim is set
- mm:ss duration input: requires custom parsing to convert to `durationSeconds` integer
- Real-time notification status: `onSnapshot` listener must be cleaned up on component unmount

---

### Platform Split

**Platform: Web Only — no mobile pass**
All tasks are [WEB]. No Pass 2. story-6.md moves to `completed/` when Web Done is fully ticked.

---

### Definition of Done

**Web Done (Pass 1 — browser, mobile web primary + desktop renders fine) — outputs `prd-6-web.md`:**
- [ ] Admin route protected by Firebase custom claim `admin: true`
- [ ] Video list, add video form, isActive toggle all functional
- [ ] Notification panel writes to `notifications` collection
- [ ] Notification status updates in real-time (onSnapshot listener)
- [ ] Responsive: usable at 480–768px (degraded but not broken)
- [ ] /check passed on web
- [ ] /uat passed on web (web only — no mobile UAT)
- [ ] Deployed to Firebase Hosting
- [ ] `prd-6-web.md` → `completed/`
- [ ] story-6.md → `completed/` (web-only — no Pass 2)
