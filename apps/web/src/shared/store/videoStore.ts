import { create } from 'zustand'
import type { Video } from '@ckd/shared/types/video'

interface VideoState {
  videos: Video[]
  loading: boolean
  error: string | null
  hydrated: boolean
  setVideos: (videos: Video[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHydrated: (hydrated: boolean) => void
  reset: () => void
}

const initialState = {
  videos: [] as Video[],
  loading: false,
  error: null as string | null,
  hydrated: false,
}

export const useVideoStore = create<VideoState>()((set) => ({
  ...initialState,
  setVideos: (videos) => set({ videos }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setHydrated: (hydrated) => set({ hydrated }),
  reset: () => set(initialState),
}))
