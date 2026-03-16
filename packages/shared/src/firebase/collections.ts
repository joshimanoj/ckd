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
import type { User } from '../types/user'

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
