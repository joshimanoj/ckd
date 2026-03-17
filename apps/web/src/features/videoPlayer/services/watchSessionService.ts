import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@ckd/shared/firebase/config'
import { calcCompletionPercent } from '@ckd/shared/utils/watchTime'
import type { WatchSessionInput } from '@ckd/shared/types/watchSession'

export async function writeWatchSession(
  userId: string,
  childProfileId: string,
  payload: WatchSessionInput,
): Promise<string> {
  const completionPercent = calcCompletionPercent(
    payload.watchedSeconds,
    payload.videoDurationSeconds,
  )
  const ref = collection(
    db,
    'users',
    userId,
    'childProfiles',
    childProfileId,
    'watchSessions',
  )
  const docRef = await addDoc(ref, {
    ...payload,
    completionPercent,
    endTime: Timestamp.now(),
    deviceType: 'web' as const,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}
