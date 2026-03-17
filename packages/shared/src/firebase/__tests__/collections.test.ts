import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockWithConverter = vi.fn(() => ({ path: 'videos', withConverter: mockWithConverter }))

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    collection: vi.fn(() => ({ path: 'videos', withConverter: mockWithConverter })),
    doc: vi.fn(() => ({ path: 'users/test-uid' })),
  }
})

describe('videosCollection', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns a CollectionReference at path "videos"', async () => {
    const { collection } = await import('firebase/firestore')
    const { videosCollection } = await import('../collections')
    videosCollection({} as Parameters<typeof videosCollection>[0])
    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'videos')
  })

  it('videoConverter.fromFirestore injects snapshot.id as videoId', async () => {
    const { videoConverter } = await import('../collections')
    const fakeSnapshot = {
      id: 'injected-id',
      data: () => ({
        youtubeVideoId: 'yt123',
        title: 'Test',
        category: 'Rhymes',
        thumbnailUrl: 'https://example.com/img.jpg',
        durationSeconds: 120,
        publishedAt: { seconds: 0, nanoseconds: 0 },
        isActive: true,
        order: 1,
      }),
    }
    const result = videoConverter.fromFirestore(
      fakeSnapshot as Parameters<typeof videoConverter.fromFirestore>[0],
      {},
    )
    expect(result.videoId).toBe('injected-id')
    expect(result.youtubeVideoId).toBe('yt123')
  })

  it('videoConverter.toFirestore omits videoId from written data', async () => {
    const { videoConverter } = await import('../collections')
    const { Timestamp } = await import('firebase/firestore')
    const video = {
      videoId: 'should-be-omitted',
      youtubeVideoId: 'yt123',
      title: 'Test',
      category: 'Rhymes' as const,
      thumbnailUrl: 'https://example.com/img.jpg',
      durationSeconds: 120,
      publishedAt: Timestamp.fromMillis(0),
      isActive: true,
      order: 1,
    }
    const written = videoConverter.toFirestore(video)
    expect((written as Record<string, unknown>)['videoId']).toBeUndefined()
    expect((written as Record<string, unknown>)['title']).toBe('Test')
  })
})
