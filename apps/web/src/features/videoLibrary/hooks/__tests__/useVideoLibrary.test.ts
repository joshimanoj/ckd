import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Firestore } from 'firebase/firestore'
import { useVideoStore } from '../../../../shared/store/videoStore'
import { makeVideo } from '../../../../test/factories/video'

const mockFetchActiveVideos = vi.fn()
const mockFetchVideosByCategory = vi.fn()

vi.mock('../../services/videoService', () => ({
  fetchActiveVideos: mockFetchActiveVideos,
  fetchVideosByCategory: mockFetchVideosByCategory,
}))

const db = {} as Firestore

describe('useVideoLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useVideoStore.setState({ videos: [], loading: false, error: null, hydrated: false })
  })

  it('fetches on mount when store is not hydrated', async () => {
    const videos = [makeVideo({ videoId: 'v1' }), makeVideo({ videoId: 'v2' })]
    mockFetchActiveVideos.mockResolvedValueOnce(videos)

    const { useVideoLibrary } = await import('../useVideoLibrary')
    const { result } = renderHook(() => useVideoLibrary(db))

    await act(async () => {})

    expect(mockFetchActiveVideos).toHaveBeenCalledTimes(1)
    expect(result.current.allVideos).toHaveLength(2)
    expect(useVideoStore.getState().hydrated).toBe(true)
  })

  it('does NOT fetch on mount when store is already hydrated', async () => {
    const cached = [makeVideo({ videoId: 'cached' })]
    useVideoStore.setState({ videos: cached, loading: false, error: null, hydrated: true })

    const { useVideoLibrary } = await import('../useVideoLibrary')
    renderHook(() => useVideoLibrary(db))

    await act(async () => {})

    expect(mockFetchActiveVideos).not.toHaveBeenCalled()
  })

  it('refresh() calls fetchActiveVideos even when hydrated', async () => {
    const initial = [makeVideo({ videoId: 'v1' })]
    useVideoStore.setState({ videos: initial, loading: false, error: null, hydrated: true })

    const updated = [makeVideo({ videoId: 'v1' }), makeVideo({ videoId: 'v2' })]
    mockFetchActiveVideos.mockResolvedValueOnce(updated)

    const { useVideoLibrary } = await import('../useVideoLibrary')
    const { result } = renderHook(() => useVideoLibrary(db))

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockFetchActiveVideos).toHaveBeenCalledTimes(1)
    expect(result.current.allVideos).toHaveLength(2)
  })

  it('selectCategory filters videos to matching category', async () => {
    const videos = [
      makeVideo({ videoId: 'r1', category: 'Rhymes' }),
      makeVideo({ videoId: 'c1', category: 'Colours' }),
      makeVideo({ videoId: 'r2', category: 'Rhymes' }),
    ]
    mockFetchActiveVideos.mockResolvedValueOnce(videos)

    const { useVideoLibrary } = await import('../useVideoLibrary')
    const { result } = renderHook(() => useVideoLibrary(db))

    await act(async () => {})
    act(() => result.current.selectCategory('Rhymes'))

    expect(result.current.videos).toHaveLength(2)
    expect(result.current.videos.every((v) => v.category === 'Rhymes')).toBe(true)
    expect(result.current.allVideos).toHaveLength(3)
  })

  it('selectCategory(null) returns all videos', async () => {
    const videos = [
      makeVideo({ videoId: 'r1', category: 'Rhymes' }),
      makeVideo({ videoId: 'c1', category: 'Colours' }),
    ]
    mockFetchActiveVideos.mockResolvedValueOnce(videos)

    const { useVideoLibrary } = await import('../useVideoLibrary')
    const { result } = renderHook(() => useVideoLibrary(db))

    await act(async () => {})
    act(() => result.current.selectCategory('Rhymes'))
    act(() => result.current.selectCategory(null))

    expect(result.current.videos).toHaveLength(2)
    expect(result.current.selectedCategory).toBeNull()
  })

  it('loading is true during fetch and false after', async () => {
    let resolvePromise!: (v: ReturnType<typeof makeVideo>[]) => void
    mockFetchActiveVideos.mockReturnValueOnce(
      new Promise<ReturnType<typeof makeVideo>[]>((resolve) => {
        resolvePromise = resolve
      }),
    )

    const { useVideoLibrary } = await import('../useVideoLibrary')
    const { result } = renderHook(() => useVideoLibrary(db))

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolvePromise([makeVideo()])
    })

    expect(result.current.loading).toBe(false)
  })

  it('error is set when fetchActiveVideos throws', async () => {
    mockFetchActiveVideos.mockRejectedValueOnce(new Error('network fail'))

    const { useVideoLibrary } = await import('../useVideoLibrary')
    const { result } = renderHook(() => useVideoLibrary(db))

    await act(async () => {})

    expect(result.current.error).toBe('network fail')
    expect(result.current.loading).toBe(false)
  })

  it('error is cleared on next successful fetch', async () => {
    useVideoStore.setState({ videos: [], loading: false, error: 'stale error', hydrated: false })
    mockFetchActiveVideos.mockResolvedValueOnce([makeVideo()])

    const { useVideoLibrary } = await import('../useVideoLibrary')
    const { result } = renderHook(() => useVideoLibrary(db))

    await act(async () => {})

    expect(result.current.error).toBeNull()
  })
})
