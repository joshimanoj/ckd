import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWatchSessionStore } from '../../../../shared/store/watchSessionStore'

const { mockWriteWatchSession } = vi.hoisted(() => ({
  mockWriteWatchSession: vi.fn().mockResolvedValue('sess-id'),
}))

vi.mock('../../services/watchSessionService', () => ({
  writeWatchSession: mockWriteWatchSession,
}))

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))

describe('useWatchSession — polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useWatchSessionStore.getState().resetSession()
    useWatchSessionStore.getState().initSession('dQw4w9WgXcQ', 'child-1', 180)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('accumulates watchedSeconds via 10s polling using currentYTTime from store', async () => {
    const { useWatchSession } = await import('../useWatchSession')

    const { unmount } = renderHook(() =>
      useWatchSession({
        videoId: 'dQw4w9WgXcQ',
        childProfileId: 'child-1',
        videoDuration: 180,
        userId: 'user-1',
      }),
    )

    // Simulate YouTube sending time updates at t=10, t=20, t=30
    await act(async () => {
      useWatchSessionStore.getState().updateCurrentYTTime(10)
      vi.advanceTimersByTime(10000)
    })
    await act(async () => {
      useWatchSessionStore.getState().updateCurrentYTTime(20)
      vi.advanceTimersByTime(10000)
    })
    await act(async () => {
      useWatchSessionStore.getState().updateCurrentYTTime(30)
      vi.advanceTimersByTime(10000)
    })

    expect(useWatchSessionStore.getState().watchedSeconds).toBe(30)
    expect(useWatchSessionStore.getState().lastKnownTime).toBe(30)

    unmount()
    // After unmount the interval should be cleared — advancing time changes nothing
    const watchedBefore = useWatchSessionStore.getState().watchedSeconds
    await act(async () => {
      useWatchSessionStore.getState().updateCurrentYTTime(40)
      vi.advanceTimersByTime(10000)
    })
    expect(useWatchSessionStore.getState().watchedSeconds).toBe(watchedBefore)
  })

  it('flushSession writes once even if called twice (hasWritten guard)', async () => {
    const { useWatchSession } = await import('../useWatchSession')

    const { result } = renderHook(() =>
      useWatchSession({
        videoId: 'dQw4w9WgXcQ',
        childProfileId: 'child-1',
        videoDuration: 180,
        userId: 'user-1',
      }),
    )

    // Set AFTER mount so initSession doesn't reset it
    await act(async () => {
      useWatchSessionStore.getState().updateCurrentYTTime(10)
    })

    await act(async () => {
      await result.current.flushSession()
    })
    await act(async () => {
      await result.current.flushSession()
    })

    expect(mockWriteWatchSession).toHaveBeenCalledTimes(1)
  })

  it('flushSession uses ytDurationSeconds when available', async () => {
    const { useWatchSession } = await import('../useWatchSession')

    const { result } = renderHook(() =>
      useWatchSession({
        videoId: 'dQw4w9WgXcQ',
        childProfileId: 'child-1',
        videoDuration: 0, // admin entered 0
        userId: 'user-1',
      }),
    )

    // Set AFTER mount — initSession (called on mount) resets these fields
    await act(async () => {
      useWatchSessionStore.getState().updateCurrentYTTime(15)
      useWatchSessionStore.getState().updateYTDuration(227)
    })

    await act(async () => {
      await result.current.flushSession()
    })

    expect(mockWriteWatchSession).toHaveBeenCalledWith(
      'user-1',
      'child-1',
      expect.objectContaining({ videoDurationSeconds: 227, watchedSeconds: 15 }),
    )
  })
})
