import { getDocs, query, where, orderBy, type Firestore } from 'firebase/firestore'
import { videosCollection } from '@ckd/shared/firebase/collections'
import type { Category, Video } from '@ckd/shared/types/video'

export async function fetchActiveVideos(db: Firestore): Promise<Video[]> {
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
