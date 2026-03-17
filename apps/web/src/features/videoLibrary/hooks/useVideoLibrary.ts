import { useState, useEffect, useCallback } from 'react'
import type { Firestore } from 'firebase/firestore'
import type { Category, Video } from '@ckd/shared/types/video'
import { useVideoStore } from '../../../shared/store/videoStore'
import { fetchActiveVideos } from '../services/videoService'

export interface UseVideoLibraryReturn {
  videos: Video[]
  allVideos: Video[]
  loading: boolean
  error: string | null
  selectedCategory: Category | null
  selectCategory: (category: Category | null) => void
  refresh: () => Promise<void>
}

export function useVideoLibrary(db: Firestore): UseVideoLibraryReturn {
  const { videos: storeVideos, loading, error, hydrated, setVideos, setLoading, setError, setHydrated } =
    useVideoStore()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const loadVideos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await fetchActiveVideos(db)
      setVideos(fetched)
      setHydrated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [db, setVideos, setLoading, setError, setHydrated])

  useEffect(() => {
    if (!hydrated) {
      void loadVideos()
    }
  }, [hydrated, loadVideos])

  const refresh = useCallback(async () => {
    setSelectedCategory(null)
    await loadVideos()
  }, [loadVideos])

  const selectCategory = useCallback((category: Category | null) => {
    setSelectedCategory(category)
  }, [])

  const videos =
    selectedCategory !== null
      ? storeVideos.filter((v) => v.category === selectedCategory)
      : storeVideos

  return {
    videos,
    allVideos: storeVideos,
    loading,
    error,
    selectedCategory,
    selectCategory,
    refresh,
  }
}
