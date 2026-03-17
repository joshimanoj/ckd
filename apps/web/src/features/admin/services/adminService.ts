import {
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@ckd/shared/firebase/config'
import { videosCollection, notificationsCollection } from '@ckd/shared/firebase/collections'
import type { Video, Category } from '@ckd/shared/types/video'
import type { Notification } from '@ckd/shared/types/notification'

export interface AddVideoInput {
  youtubeVideoId: string
  title: string
  category: Category
  thumbnailUrl: string
  durationSeconds: number
  order: number
}

export interface AddNotificationInput {
  title: string
  body: string
  youtubeVideoId: string | null
}

export async function fetchAllVideos(): Promise<Video[]> {
  const q = query(videosCollection(db), orderBy('publishedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

export async function getMaxOrderForCategory(category: Category): Promise<number> {
  const all = await fetchAllVideos()
  const inCategory = all.filter((v) => v.category === category)
  if (inCategory.length === 0) return 0
  return Math.max(...inCategory.map((v) => v.order))
}

export async function addVideo(input: AddVideoInput): Promise<void> {
  await addDoc(videosCollection(db), {
    ...input,
    isActive: true,
    publishedAt: serverTimestamp(),
  } as unknown as Video)
}

export async function toggleIsActive(videoId: string, currentIsActive: boolean): Promise<void> {
  await updateDoc(doc(db, 'videos', videoId), { isActive: !currentIsActive })
}

export async function addNotification(input: AddNotificationInput): Promise<string> {
  const ref = await addDoc(notificationsCollection(db), {
    ...input,
    createdAt: serverTimestamp(),
    sentAt: null,
    status: 'pending',
  } as unknown as Notification)
  return ref.id
}

export function subscribeToNotification(
  notificationId: string,
  callback: (n: Notification | null) => void,
): Unsubscribe {
  const ref = doc(notificationsCollection(db), notificationId)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}
