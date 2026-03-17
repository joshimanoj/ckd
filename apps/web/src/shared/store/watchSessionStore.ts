import { create } from 'zustand'
import { Timestamp } from 'firebase/firestore'

interface WatchSessionState {
  youtubeVideoId: string | null
  childProfileId: string | null
  videoDurationSeconds: number
  watchedSeconds: number
  lastKnownTime: number
  startTime: Timestamp | null
  hasWritten: boolean
  initSession: (videoId: string, childProfileId: string, durationSeconds: number) => void
  addWatchedDelta: (delta: number) => void
  updateLastKnownTime: (currentTime: number) => void
  markWritten: () => void
  resetSession: () => void
}

const initialState = {
  youtubeVideoId: null as string | null,
  childProfileId: null as string | null,
  videoDurationSeconds: 0,
  watchedSeconds: 0,
  lastKnownTime: 0,
  startTime: null as Timestamp | null,
  hasWritten: false,
}

export const useWatchSessionStore = create<WatchSessionState>()((set) => ({
  ...initialState,
  initSession: (videoId, childProfileId, durationSeconds) =>
    set({
      youtubeVideoId: videoId,
      childProfileId,
      videoDurationSeconds: durationSeconds,
      watchedSeconds: 0,
      lastKnownTime: 0,
      startTime: Timestamp.now(),
      hasWritten: false,
    }),
  addWatchedDelta: (delta) =>
    set((state) => ({ watchedSeconds: state.watchedSeconds + delta })),
  updateLastKnownTime: (currentTime) => set({ lastKnownTime: currentTime }),
  markWritten: () => set({ hasWritten: true }),
  resetSession: () => set(initialState),
}))
