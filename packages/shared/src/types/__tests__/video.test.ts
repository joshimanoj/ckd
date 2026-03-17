import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'

describe('Video type and Category enum', () => {
  it('isVideo returns true for a valid Video object', async () => {
    const { isVideo } = await import('../video')
    const valid = {
      videoId: 'test-1',
      youtubeVideoId: 'dQw4w9WgXcQ',
      title: 'Test Rhyme',
      category: 'Rhymes',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      durationSeconds: 180,
      publishedAt: Timestamp.now(),
      isActive: true,
      order: 1,
    }
    expect(isVideo(valid)).toBe(true)
  })

  it('isVideo returns false when youtubeVideoId is missing', async () => {
    const { isVideo } = await import('../video')
    const invalid = {
      videoId: 'test-1',
      title: 'Test',
      category: 'Rhymes',
      thumbnailUrl: 'https://example.com/img.jpg',
      durationSeconds: 60,
      publishedAt: Timestamp.now(),
      isActive: true,
      order: 1,
    }
    expect(isVideo(invalid)).toBe(false)
  })

  it('isVideo returns false for invalid category string', async () => {
    const { isVideo } = await import('../video')
    const invalid = {
      videoId: 'test-1',
      youtubeVideoId: 'abc',
      title: 'Test',
      category: 'Maths',
      thumbnailUrl: 'https://example.com/img.jpg',
      durationSeconds: 60,
      publishedAt: Timestamp.now(),
      isActive: true,
      order: 1,
    }
    expect(isVideo(invalid)).toBe(false)
  })

  it('isVideo returns false for null', async () => {
    const { isVideo } = await import('../video')
    expect(isVideo(null)).toBe(false)
  })

  it('CATEGORIES contains all 5 categories', async () => {
    const { CATEGORIES } = await import('../video')
    expect(CATEGORIES).toHaveLength(5)
    expect(CATEGORIES).toContain('Rhymes')
    expect(CATEGORIES).toContain('Colours')
    expect(CATEGORIES).toContain('Numbers')
    expect(CATEGORIES).toContain('Animals')
    expect(CATEGORIES).toContain('Stories')
  })
})
