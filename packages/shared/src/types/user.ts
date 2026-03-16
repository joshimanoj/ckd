import { Timestamp } from 'firebase/firestore'

export interface ChildProfile {
  id: string
  name: string
  dateOfBirth: Timestamp
  createdAt: Timestamp
}

export function isChildProfile(obj: unknown): obj is ChildProfile {
  if (typeof obj !== 'object' || obj === null) return false
  const p = obj as Record<string, unknown>
  return (
    typeof p['name'] === 'string' &&
    p['name'].length > 0 &&
    p['dateOfBirth'] instanceof Timestamp &&
    p['createdAt'] instanceof Timestamp
  )
}

export interface User {
  uid: string
  email: string
  displayName: string
  fcmToken: string | null
  notificationsEnabled: boolean
  consentGiven: boolean
  consentTimestamp: Timestamp | null
  createdAt: Timestamp
}

export function isUser(obj: unknown): obj is User {
  if (typeof obj !== 'object' || obj === null) return false
  const u = obj as Record<string, unknown>
  return (
    typeof u['uid'] === 'string' &&
    typeof u['email'] === 'string' &&
    typeof u['displayName'] === 'string' &&
    (u['fcmToken'] === null || typeof u['fcmToken'] === 'string') &&
    typeof u['notificationsEnabled'] === 'boolean' &&
    typeof u['consentGiven'] === 'boolean' &&
    (u['consentTimestamp'] === null || u['consentTimestamp'] instanceof Timestamp) &&
    u['createdAt'] instanceof Timestamp
  )
}
