import { getDocs, query, where, orderBy, type Firestore } from 'firebase/firestore'
import { videosCollection } from '@ckd/shared/firebase/collections'
import type { Category, Video } from '@ckd/shared/types/video'

export async function fetchActiveVideos(db: Firestore): Promise<Video[]> {
  // Test-only: honour artificial delay set by e2e tests (emulator mode only)
  if (import.meta.env['VITE_USE_EMULATOR'] === 'true') {
    const w = window as unknown as Record<string, number>
    const delayMs = w['__testVideoFetchDelayMs'] ?? 0
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
      w['__testVideoFetchDelayMs'] = 0
    }
  }
  const ref = videosCollection(db)
  const q = query(ref, where('isActive', '==', true), orderBy('publishedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ ...doc.data(), videoId: doc.id }))
}

export async function fetchVideosByCategory(db: Firestore, category: Category): Promise<Video[]> {
  const ref = videosCollection(db)
  const q = query(
    ref,
    where('isActive', '==', true),
    where('category', '==', category),
    orderBy('order', 'asc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ ...doc.data(), videoId: doc.id }))
}
