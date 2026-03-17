import { useEffect, type RefObject } from 'react'
import { useWatchSessionStore } from '../../../shared/store/watchSessionStore'
import { writeWatchSession } from '../services/watchSessionService'
import type { WatchSessionInput } from '@ckd/shared/types/watchSession'

export interface YouTubePlayerRef {
  getCurrentTime: () => number
}

interface UseWatchSessionParams {
  videoId: string
  childProfileId: string
  videoDuration: number
  playerRef: RefObject<YouTubePlayerRef | null>
  userId: string
}

export function useWatchSession({
  videoId,
  childProfileId,
  videoDuration,
  playerRef,
  userId,
}: UseWatchSessionParams) {
  // Zustand actions are stable references — destructuring outside effects is fine
  const initSession = useWatchSessionStore((s) => s.initSession)
  const addWatchedDelta = useWatchSessionStore((s) => s.addWatchedDelta)
  const updateLastKnownTime = useWatchSessionStore((s) => s.updateLastKnownTime)
  const markWritten = useWatchSessionStore((s) => s.markWritten)

  useEffect(() => {
    initSession(videoId, childProfileId, videoDuration)
  }, [videoId, childProfileId, videoDuration, initSession])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = playerRef.current?.getCurrentTime() ?? 0
      const { lastKnownTime } = useWatchSessionStore.getState()
      const delta = Math.max(0, currentTime - lastKnownTime)
      addWatchedDelta(delta)
      updateLastKnownTime(currentTime)
    }, 10000)

    return () => clearInterval(interval)
  }, [playerRef, addWatchedDelta, updateLastKnownTime])

  const flushSession = async () => {
    const state = useWatchSessionStore.getState()
    if (state.hasWritten) return
    if (!state.youtubeVideoId || !state.childProfileId || !state.startTime) return

    const currentTime = playerRef.current?.getCurrentTime() ?? 0
    const delta = Math.max(0, currentTime - state.lastKnownTime)
    addWatchedDelta(delta)
    updateLastKnownTime(currentTime)

    const finalState = useWatchSessionStore.getState()
    const payload: WatchSessionInput = {
      youtubeVideoId: finalState.youtubeVideoId!,
      videoDurationSeconds: finalState.videoDurationSeconds,
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
