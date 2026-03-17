import { addDoc, getDocs, getDoc, serverTimestamp, Timestamp, type Firestore } from 'firebase/firestore'
import { db as defaultDb } from '@ckd/shared/firebase/config'
import { childProfilesCollection } from '@ckd/shared/firebase/collections'
import { dobFromAgeRange, type AgeRange } from '@ckd/shared/utils/ageRange'
import type { ChildProfile } from '@ckd/shared/types/user'

let _db: Firestore = defaultDb

export function _setDbForTesting(testDb: Firestore) {
  _db = testDb
}

export async function createChildProfile(
  uid: string,
  name: string,
  ageRange: AgeRange,
): Promise<ChildProfile> {
  if (
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>)['__TEST_FAIL_PROFILE_WRITE']
  ) {
    throw new Error('Test: forced write failure')
  }

  const ref = await addDoc(childProfilesCollection(_db, uid), {
    id: '',
    name: name.trim(),
    dateOfBirth: Timestamp.fromDate(dobFromAgeRange(ageRange)),
    createdAt: serverTimestamp() as Timestamp,
  })

  const snap = await getDoc(ref)
  const data = snap.data()!
  return { ...data, id: snap.id }
}

export async function getChildProfiles(uid: string): Promise<ChildProfile[]> {
  const snap = await getDocs(childProfilesCollection(_db, uid))
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }))
}
