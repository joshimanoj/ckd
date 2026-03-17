import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import { useWatchSessionStore } from '../../../../shared/store/watchSessionStore'

vi.mock('../../services/watchSessionService', () => ({
  writeWatchSession: vi.fn().mockResolvedValue('sess-id'),
}))

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))

describe('useWatchSession — init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWatchSessionStore.getState().resetSession()
  })

  it('initializes session on mount — sets videoId, childProfileId, startTime, watchedSeconds=0', async () => {
    const { useWatchSession } = await import('../useWatchSession')

    renderHook(() =>
      useWatchSession({
        videoId: 'dQw4w9WgXcQ',
        childProfileId: 'child-1',
        videoDuration: 180,
        userId: 'user-1',
      }),
    )

    const state = useWatchSessionStore.getState()
    expect(state.youtubeVideoId).toBe('dQw4w9WgXcQ')
    expect(state.childProfileId).toBe('child-1')
    expect(state.startTime).not.toBeNull()
    expect(state.startTime).toBeInstanceOf(Timestamp)
    expect(state.watchedSeconds).toBe(0)
  })
})
