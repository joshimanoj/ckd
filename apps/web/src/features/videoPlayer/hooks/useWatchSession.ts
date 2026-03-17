import { useEffect } from 'react'
import { useWatchSessionStore } from '../../../shared/store/watchSessionStore'
import { writeWatchSession } from '../services/watchSessionService'
import type { WatchSessionInput } from '@ckd/shared/types/watchSession'

interface UseWatchSessionParams {
  videoId: string
  childProfileId: string
  videoDuration: number
  userId: string
}

export function useWatchSession({
  videoId,
  childProfileId,
  videoDuration,
  userId,
}: UseWatchSessionParams) {
  const initSession = useWatchSessionStore((s) => s.initSession)
  const addWatchedDelta = useWatchSessionStore((s) => s.addWatchedDelta)
  const updateLastKnownTime = useWatchSessionStore((s) => s.updateLastKnownTime)
  const markWritten = useWatchSessionStore((s) => s.markWritten)

  useEffect(() => {
    initSession(videoId, childProfileId, videoDuration)
  }, [videoId, childProfileId, videoDuration, initSession])

  // Every 10 s — accumulate watched delta from the store's live currentYTTime
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useWatchSessionStore.getState()
      const currentTime = state.currentYTTime
      const delta = Math.max(0, currentTime - state.lastKnownTime)
      addWatchedDelta(delta)
      updateLastKnownTime(currentTime)
    }, 10000)
    return () => clearInterval(interval)
  }, [addWatchedDelta, updateLastKnownTime])

  const flushSession = async () => {
    const state = useWatchSessionStore.getState()
    if (state.hasWritten) return
    if (!state.youtubeVideoId || !state.childProfileId || !state.startTime) return

    // Capture final delta from last known time to now
    const currentTime = state.currentYTTime
    const delta = Math.max(0, currentTime - state.lastKnownTime)
    addWatchedDelta(delta)
    updateLastKnownTime(currentTime)

    const finalState = useWatchSessionStore.getState()
    // Prefer real YouTube duration; fall back to admin-entered value
    const duration =
      finalState.ytDurationSeconds > 0
        ? finalState.ytDurationSeconds
        : finalState.videoDurationSeconds

    const payload: WatchSessionInput = {
      youtubeVideoId: finalState.youtubeVideoId!,
      videoDurationSeconds: duration,
      watchedSeconds: finalState.watchedSeconds,
      completionPercent: 0,
      startTime: finalState.startTime!,
      endTime: null,
      deviceType: 'web',
    }

    await writeWatchSession(userId, finalState.childProfileId!, payload)
    markWritten()
  }

  return { flushSession }
}
