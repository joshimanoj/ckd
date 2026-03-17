import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { WatchSession } from '@ckd/shared/types/watchSession'

export async function fetchSessionsSince(
  db: Firestore,
  uid: string,
  childProfileId: string,
  since: Date,
): Promise<WatchSession[]> {
  const sessionsRef = collection(
    db,
    'users',
    uid,
    'childProfiles',
    childProfileId,
    'watchSessions',
  )
  const q = query(
    sessionsRef,
    where('startTime', '>=', Timestamp.fromDate(since)),
    orderBy('startTime', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((doc) => doc.data() as WatchSession)
}
