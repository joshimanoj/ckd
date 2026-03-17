import { describe, it, expect, beforeEach } from 'vitest'
import { useWatchSessionStore } from '../watchSessionStore'
import { Timestamp } from 'firebase/firestore'

describe('watchSessionStore', () => {
  beforeEach(() => {
    useWatchSessionStore.getState().resetSession()
  })

  it('initSession sets videoId, childProfileId, startTime; resets counters and hasWritten', () => {
    useWatchSessionStore.getState().initSession('abc', 'child-1', 180)
    const state = useWatchSessionStore.getState()
    expect(state.youtubeVideoId).toBe('abc')
    expect(state.childProfileId).toBe('child-1')
    expect(state.videoDurationSeconds).toBe(180)
    expect(state.startTime).not.toBeNull()
    expect(state.startTime).toBeInstanceOf(Timestamp)
    expect(state.watchedSeconds).toBe(0)
    expect(state.hasWritten).toBe(false)
  })

  it('addWatchedDelta accumulates watchedSeconds', () => {
    useWatchSessionStore.getState().initSession('abc', 'child-1', 180)
    useWatchSessionStore.getState().addWatchedDelta(10)
    expect(useWatchSessionStore.getState().watchedSeconds).toBe(10)
    useWatchSessionStore.getState().addWatchedDelta(5)
    expect(useWatchSessionStore.getState().watchedSeconds).toBe(15)
  })

  it('markWritten sets hasWritten to true', () => {
    useWatchSessionStore.getState().initSession('abc', 'child-1', 180)
    useWatchSessionStore.getState().markWritten()
    expect(useWatchSessionStore.getState().hasWritten).toBe(true)
  })

  it('resetSession clears all fields', () => {
    useWatchSessionStore.getState().initSession('abc', 'child-1', 180)
    useWatchSessionStore.getState().addWatchedDelta(30)
    useWatchSessionStore.getState().resetSession()
    const state = useWatchSessionStore.getState()
    expect(state.youtubeVideoId).toBeNull()
    expect(state.childProfileId).toBeNull()
    expect(state.watchedSeconds).toBe(0)
    expect(state.hasWritten).toBe(false)
    expect(state.startTime).toBeNull()
  })

  it('second initSession resets hasWritten to false', () => {
    useWatchSessionStore.getState().initSession('abc', 'child-1', 180)
    useWatchSessionStore.getState().markWritten()
    expect(useWatchSessionStore.getState().hasWritten).toBe(true)
    useWatchSessionStore.getState().initSession('xyz', 'child-2', 120)
    expect(useWatchSessionStore.getState().hasWritten).toBe(false)
  })

  it('updateLastKnownTime updates lastKnownTime', () => {
    useWatchSessionStore.getState().updateLastKnownTime(42)
    expect(useWatchSessionStore.getState().lastKnownTime).toBe(42)
  })
})
