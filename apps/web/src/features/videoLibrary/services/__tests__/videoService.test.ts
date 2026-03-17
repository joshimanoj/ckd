import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import { makeVideo } from '../../../../test/factories/video'

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    getDocs: vi.fn(),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(() => 'mock-where'),
    orderBy: vi.fn(() => 'mock-orderby'),
    collection: vi.fn(() => ({ path: 'videos' })),
  }
})

vi.mock('@ckd/shared/firebase/collections', () => ({
  videosCollection: vi.fn(() => ({ path: 'videos' })),
}))

function makeSnapshot(videos: ReturnType<typeof makeVideo>[]) {
  return {
    docs: videos.map((v) => ({
      id: v.videoId,
      data: () => ({ ...v }),
    })),
  }
}

describe('videoService', () => {
  const db = {} as Firestore

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchActiveVideos', () => {
    it('calls getDocs with isActive==true and publishedAt desc query', async () => {
      const { getDocs, query, where, orderBy } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValueOnce(makeSnapshot([]) as ReturnType<typeof getDocs>)

      const { fetchActiveVideos } = await import('../videoService')
      await fetchActiveVideos(db)

      expect(vi.mocked(query)).toHaveBeenCalledTimes(1)
      expect(vi.mocked(where)).toHaveBeenCalledWith('isActive', '==', true)
      expect(vi.mocked(orderBy)).toHaveBeenCalledWith('publishedAt', 'desc')
      expect(vi.mocked(getDocs)).toHaveBeenCalledTimes(1)
    })

    it('returns a mapped Video array from snapshot', async () => {
      const { getDocs } = await import('firebase/firestore')
      const videos = [makeVideo({ videoId: 'v1', title: 'One' }), makeVideo({ videoId: 'v2', title: 'Two' })]
      vi.mocked(getDocs).mockResolvedValueOnce(makeSnapshot(videos) as ReturnType<typeof getDocs>)

      const { fetchActiveVideos } = await import('../videoService')
      const result = await fetchActiveVideos(db)

      expect(result).toHaveLength(2)
      expect(result[0].videoId).toBe('v1')
      expect(result[1].title).toBe('Two')
    })

    it('returns [] when snapshot is empty', async () => {
      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValueOnce(makeSnapshot([]) as ReturnType<typeof getDocs>)

      const { fetchActiveVideos } = await import('../videoService')
      const result = await fetchActiveVideos(db)
      expect(result).toEqual([])
    })

    it('propagates errors from getDocs', async () => {
      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('network error'))

      const { fetchActiveVideos } = await import('../videoService')
      await expect(fetchActiveVideos(db)).rejects.toThrow('network error')
    })
  })

  describe('fetchVideosByCategory', () => {
    it('calls getDocs with category filter and order asc', async () => {
      const { getDocs, query, where, orderBy } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValueOnce(makeSnapshot([]) as ReturnType<typeof getDocs>)

      const { fetchVideosByCategory } = await import('../videoService')
      await fetchVideosByCategory(db, 'Rhymes')

      expect(vi.mocked(where)).toHaveBeenCalledWith('category', '==', 'Rhymes')
      expect(vi.mocked(orderBy)).toHaveBeenCalledWith('order', 'asc')
      expect(vi.mocked(query)).toHaveBeenCalledTimes(1)
      expect(vi.mocked(getDocs)).toHaveBeenCalledTimes(1)
    })

    it('returns a filtered Video array', async () => {
      const { getDocs } = await import('firebase/firestore')
      const videos = [makeVideo({ videoId: 'r1', category: 'Rhymes' })]
      vi.mocked(getDocs).mockResolvedValueOnce(makeSnapshot(videos) as ReturnType<typeof getDocs>)

      const { fetchVideosByCategory } = await import('../videoService')
      const result = await fetchVideosByCategory(db, 'Rhymes')
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('Rhymes')
    })
  })
})
