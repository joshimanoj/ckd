import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Video } from '@ckd/shared/types/video'
import type { Notification } from '@ckd/shared/types/notification'

const mockFetchAllVideos = vi.fn()
const mockAddVideo = vi.fn()
const mockToggleIsActive = vi.fn()
const mockAddNotification = vi.fn()
const mockSubscribeToNotification = vi.fn()
const mockGetMaxOrderForCategory = vi.fn()

vi.mock('../services/adminService', () => ({
  fetchAllVideos: (...args: unknown[]) => mockFetchAllVideos(...args),
  addVideo: (...args: unknown[]) => mockAddVideo(...args),
  toggleIsActive: (...args: unknown[]) => mockToggleIsActive(...args),
  addNotification: (...args: unknown[]) => mockAddNotification(...args),
  subscribeToNotification: (...args: unknown[]) => mockSubscribeToNotification(...args),
  getMaxOrderForCategory: (...args: unknown[]) => mockGetMaxOrderForCategory(...args),
}))

import { useAdmin } from '../hooks/useAdmin'

const makeVideo = (id: string): Video => ({
  videoId: id, youtubeVideoId: 'abc', title: 'Test', category: 'Rhymes',
  thumbnailUrl: 'https://t.jpg', durationSeconds: 60,
  publishedAt: { seconds: 0, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
  isActive: true, order: 1,
})

describe('useAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchAllVideos.mockResolvedValue([makeVideo('v1')])
    mockSubscribeToNotification.mockReturnValue(vi.fn())
  })

  it('loads videos on mount and sets loading false', async () => {
    const { result } = renderHook(() => useAdmin())
    expect(result.current.loading).toBe(true)
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.videos).toHaveLength(1)
    expect(result.current.videos[0].videoId).toBe('v1')
  })

  it('sets error when fetchAllVideos throws', async () => {
    mockFetchAllVideos.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useAdmin())
    await act(async () => {})
    expect(result.current.error).toBe('Failed to load videos')
  })

  it('publishVideo calls addVideo with correct order then reloads', async () => {
    mockGetMaxOrderForCategory.mockResolvedValue(2)
    mockAddVideo.mockResolvedValue(undefined)
    mockFetchAllVideos.mockResolvedValue([makeVideo('v1'), makeVideo('v2')])
    const { result } = renderHook(() => useAdmin())
    await act(async () => {})

    await act(async () => {
      await result.current.publishVideo({
        youtubeVideoId: 'xyz', title: 'New', category: 'Rhymes',
        thumbnailUrl: 'https://t.jpg', durationSeconds: 90,
      })
    })
    expect(mockAddVideo).toHaveBeenCalledWith(expect.objectContaining({ order: 3 }))
    expect(mockFetchAllVideos).toHaveBeenCalledTimes(2)
  })

  it('toggleVideoActive calls toggleIsActive then reloads', async () => {
    mockToggleIsActive.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAdmin())
    await act(async () => {})

    await act(async () => {
      await result.current.toggleVideoActive('v1', true)
    })
    expect(mockToggleIsActive).toHaveBeenCalledWith('v1', true)
    expect(mockFetchAllVideos).toHaveBeenCalledTimes(2)
  })

  it('sendNotification calls addNotification and starts subscription', async () => {
    mockAddNotification.mockResolvedValue('notif-123')
    const { result } = renderHook(() => useAdmin())
    await act(async () => {})

    await act(async () => {
      await result.current.sendNotification({ title: 'Hi', body: 'Body', youtubeVideoId: null })
    })
    expect(mockAddNotification).toHaveBeenCalledWith({ title: 'Hi', body: 'Body', youtubeVideoId: null })
    expect(mockSubscribeToNotification).toHaveBeenCalledWith('notif-123', expect.any(Function))
  })

  it('latestNotification updates when subscription callback fires', async () => {
    mockAddNotification.mockResolvedValue('notif-abc')
    const fakeNotif: Partial<Notification> = { notificationId: 'notif-abc', status: 'sent' }
    mockSubscribeToNotification.mockImplementation(
      (_id: string, cb: (n: Partial<Notification>) => void) => {
        cb(fakeNotif)
        return vi.fn()
      },
    )
    const { result } = renderHook(() => useAdmin())
    await act(async () => {})

    await act(async () => {
      await result.current.sendNotification({ title: 'Test', body: 'B', youtubeVideoId: null })
    })
    expect(result.current.latestNotification?.status).toBe('sent')
    expect(result.current.notificationLoading).toBe(false)
  })

  it('unsubscribes from notification listener on unmount', async () => {
    const unsub = vi.fn()
    mockAddNotification.mockResolvedValue('n1')
    mockSubscribeToNotification.mockReturnValue(unsub)
    const { result, unmount } = renderHook(() => useAdmin())
    await act(async () => {})

    await act(async () => {
      await result.current.sendNotification({ title: 'Hi', body: 'B', youtubeVideoId: null })
    })
    unmount()
    expect(unsub).toHaveBeenCalled()
  })
})
