import type { Timestamp } from 'firebase/firestore'

export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface Notification {
  notificationId: string
  title: string
  body: string
  youtubeVideoId: string | null
  createdAt: Timestamp
  sentAt: Timestamp | null
  status: NotificationStatus
}
