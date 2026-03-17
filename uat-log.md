# uat-log.md

---

## UAT Rejection: Story #7 — Video Player & Watch Session Tracking | 2026-03-17 10:00

Attempt: 1

Failed items:
- Flow 2 (Play/Pause): clicking play/pause button does not pause or resume the video
- Visual Check: player layout does not match prototype screen 5 — missing progress bar, "Up Next" section, gradient video header, and structured controls row

Human feedback: "the player screen was supposed to look like screen 5 here. currently its a full player only, the view in the design is not created. the pause does not work"

Root cause (if known):
- Pause: `handlePlayPause` only toggles local React state; never sends `postMessage` to the YouTube iframe to call `pauseVideo`/`playVideo`
- Layout: implemented as full-screen immersive (matches story-7.md spec text) but prototype shows a music-player card layout with top video area, progress bar, control row, and Up Next list

Fix applied: Added iframeRef + useEffect postMessage for pause/play; redesigned PlayerScreen to match prototype — gradient video section (top 50%), progress bar + timestamps, control row, Up Next scrollable list

Status: Open
