import { describe, it, expect, beforeEach } from 'vitest'
import { useVideoStore } from '../videoStore'
import { makeVideo } from '../../../test/factories/video'

describe('videoStore', () => {
  beforeEach(() => {
    useVideoStore.setState({ videos: [], loading: false, error: null, hydrated: false })
  })

  it('initial state: videos=[], loading=false, error=null, hydrated=false', () => {
    const { videos, loading, error, hydrated } = useVideoStore.getState()
    expect(videos).toEqual([])
    expect(loading).toBe(false)
    expect(error).toBeNull()
    expect(hydrated).toBe(false)
  })

  it('setVideos updates the videos array', () => {
    const v1 = makeVideo({ videoId: 'v1', title: 'One' })
    const v2 = makeVideo({ videoId: 'v2', title: 'Two' })
    useVideoStore.getState().setVideos([v1, v2])
    expect(useVideoStore.getState().videos).toHaveLength(2)
    expect(useVideoStore.getState().videos[0].videoId).toBe('v1')
  })

  it('setLoading toggles loading flag', () => {
    useVideoStore.getState().setLoading(true)
    expect(useVideoStore.getState().loading).toBe(true)
    useVideoStore.getState().setLoading(false)
    expect(useVideoStore.getState().loading).toBe(false)
  })

  it('setError sets error string', () => {
    useVideoStore.getState().setError('network failure')
    expect(useVideoStore.getState().error).toBe('network failure')
  })

  it('setHydrated transitions hydrated from false to true', () => {
    useVideoStore.getState().setHydrated(true)
    expect(useVideoStore.getState().hydrated).toBe(true)
  })

  it('reset restores initial state', () => {
    useVideoStore.getState().setVideos([makeVideo()])
    useVideoStore.getState().setLoading(true)
    useVideoStore.getState().setError('err')
    useVideoStore.getState().setHydrated(true)
    useVideoStore.getState().reset()
    const s = useVideoStore.getState()
    expect(s.videos).toEqual([])
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
    expect(s.hydrated).toBe(false)
  })
})
