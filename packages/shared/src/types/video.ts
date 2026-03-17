import type { Timestamp } from 'firebase/firestore'

export type Category = 'Rhymes' | 'Colours' | 'Numbers' | 'Animals' | 'Stories'

export const CATEGORIES: Category[] = ['Rhymes', 'Colours', 'Numbers', 'Animals', 'Stories']

export interface Video {
  videoId: string
  youtubeVideoId: string
  title: string
  category: Category
  thumbnailUrl: string
  durationSeconds: number
  publishedAt: Timestamp
  isActive: boolean
  order: number
}

export function isVideo(obj: unknown): obj is Video {
  if (typeof obj !== 'object' || obj === null) return false
  const v = obj as Record<string, unknown>
  return (
    typeof v['videoId'] === 'string' &&
    typeof v['youtubeVideoId'] === 'string' &&
    typeof v['title'] === 'string' &&
    CATEGORIES.includes(v['category'] as Category) &&
    typeof v['thumbnailUrl'] === 'string' &&
    typeof v['durationSeconds'] === 'number' &&
    v['publishedAt'] !== undefined &&
    typeof v['isActive'] === 'boolean' &&
    typeof v['order'] === 'number'
  )
}
