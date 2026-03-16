import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  Firestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore'
import type { User, ChildProfile } from '../types/user'

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User) {
    return user
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): User {
    const data = snapshot.data(options)
    return data as User
  },
}

export function usersCollection(db: Firestore): CollectionReference<User> {
  return collection(db, 'users').withConverter(userConverter)
}

export function userDoc(db: Firestore, uid: string): DocumentReference<User> {
  return doc(db, 'users', uid).withConverter(userConverter)
}

const childProfileConverter: FirestoreDataConverter<ChildProfile> = {
  toFirestore(profile: ChildProfile) {
    const { id: _id, ...rest } = profile
    return rest
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ChildProfile {
    const data = snapshot.data(options)
    return { id: snapshot.id, ...data } as ChildProfile
  },
}

export function childProfilesCollection(
  db: Firestore,
  uid: string,
): CollectionReference<ChildProfile> {
  return collection(db, 'users', uid, 'childProfiles').withConverter(childProfileConverter)
}
