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
  const mockGetCurrentTime = vi.fn()
  const mockPlayerRef = { current: { getCurrentTime: mockGetCurrentTime } }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useWatchSessionStore.getState().resetSession()
    useWatchSessionStore.getState().initSession('dQw4w9WgXcQ', 'child-1', 180)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('accumulates watchedSeconds via 10s polling', async () => {
    const { useWatchSession } = await import('../useWatchSession')
    let callCount = 0
    mockGetCurrentTime.mockImplementation(() => {
      callCount++
      return callCount * 10
    })

    const { unmount } = renderHook(() =>
      useWatchSession({
        videoId: 'dQw4w9WgXcQ',
        childProfileId: 'child-1',
        videoDuration: 180,
        playerRef: mockPlayerRef as never,
        userId: 'user-1',
      }),
    )

    await act(async () => {
      vi.advanceTimersByTime(30000)
    })

    expect(useWatchSessionStore.getState().watchedSeconds).toBe(30)
    expect(useWatchSessionStore.getState().lastKnownTime).toBe(30)

    const callsBefore = mockGetCurrentTime.mock.calls.length
    unmount()

    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    expect(mockGetCurrentTime.mock.calls.length).toBe(callsBefore)
  })

  it('flushSession writes once even if called twice (hasWritten guard)', async () => {
    const { useWatchSession } = await import('../useWatchSession')
    mockGetCurrentTime.mockReturnValue(10)

    const { result } = renderHook(() =>
      useWatchSession({
        videoId: 'dQw4w9WgXcQ',
        childProfileId: 'child-1',
        videoDuration: 180,
        playerRef: mockPlayerRef as never,
        userId: 'user-1',
      }),
    )

    await act(async () => {
      await result.current.flushSession()
    })
    await act(async () => {
      await result.current.flushSession()
    })

    expect(mockWriteWatchSession).toHaveBeenCalledTimes(1)
  })
})
