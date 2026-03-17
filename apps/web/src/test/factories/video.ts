import type { Video } from '@ckd/shared/types/video'
import { Timestamp } from 'firebase/firestore'

export const makeVideo = (overrides?: Partial<Video>): Video => ({
  videoId: 'test-video-1',
  youtubeVideoId: 'dQw4w9WgXcQ',
  title: 'Test Rhyme',
  category: 'Rhymes',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
  durationSeconds: 180,
  publishedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
  isActive: true,
  order: 1,
  ...overrides,
})
