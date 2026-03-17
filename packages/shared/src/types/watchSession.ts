import type { Timestamp, FieldValue } from 'firebase/firestore'

export type DeviceType = 'android' | 'web'

export interface WatchSession {
  sessionId: string
  youtubeVideoId: string
  videoDurationSeconds: number
  watchedSeconds: number
  completionPercent: number
  startTime: Timestamp
  endTime: Timestamp | null
  deviceType: DeviceType
  createdAt: Timestamp | FieldValue
}

export type WatchSessionInput = Omit<WatchSession, 'sessionId' | 'createdAt'>
