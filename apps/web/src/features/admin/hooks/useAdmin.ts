import { useState, useEffect, useCallback, useRef } from 'react'
import type { Video } from '@ckd/shared/types/video'
import type { Notification } from '@ckd/shared/types/notification'
import type { AddVideoInput, AddNotificationInput } from '../services/adminService'
import {
  fetchAllVideos,
  addVideo,
  toggleIsActive,
  addNotification,
  subscribeToNotification,
  getMaxOrderForCategory,
} from '../services/adminService'

export interface UseAdminReturn {
  videos: Video[]
  loading: boolean
  error: string | null
  publishVideo: (input: Omit<AddVideoInput, 'order'>) => Promise<void>
  toggleVideoActive: (videoId: string, currentIsActive: boolean) => Promise<void>
  sendNotification: (input: AddNotificationInput) => Promise<void>
  latestNotification: Notification | null
  notificationLoading: boolean
}

export function useAdmin(): UseAdminReturn {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

  const loadVideos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const vids = await fetchAllVideos()
      setVideos(vids)
    } catch {
      setError('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVideos()
  }, [loadVideos])

  useEffect(() => {
    return () => {
      unsubRef.current?.()
    }
  }, [])

  const publishVideo = useCallback(
    async (input: Omit<AddVideoInput, 'order'>) => {
      const maxOrder = await getMaxOrderForCategory(input.category)
      await addVideo({ ...input, order: maxOrder + 1 })
      await loadVideos()
    },
    [loadVideos],
  )

  const toggleVideoActive = useCallback(
    async (videoId: string, currentIsActive: boolean) => {
      await toggleIsActive(videoId, currentIsActive)
      await loadVideos()
    },
    [loadVideos],
  )

  const sendNotification = useCallback(async (input: AddNotificationInput) => {
    setNotificationLoading(true)
    unsubRef.current?.()
    const id = await addNotification(input)
    const unsub = subscribeToNotification(id, (n) => {
      setLatestNotification(n)
      if (n?.status !== 'pending') {
        setNotificationLoading(false)
      }
    })
    unsubRef.current = unsub
  }, [])

  return {
    videos,
    loading,
    error,
    publishVideo,
    toggleVideoActive,
    sendNotification,
    latestNotification,
    notificationLoading,
  }
}
