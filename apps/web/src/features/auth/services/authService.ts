import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type UserCredential,
  type Unsubscribe,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@ckd/shared/firebase/config'
import { userDoc } from '@ckd/shared/firebase/collections'
import type { User } from '@ckd/shared/types/user'

const googleProvider = new GoogleAuthProvider()

export function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider)
}

export function signOutUser(): Promise<void> {
  return signOut(auth)
}

export async function createUserDoc(user: FirebaseUser): Promise<void> {
  const ref = userDoc(db, user.uid)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) return

  const newUser: Omit<User, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    fcmToken: null,
    notificationsEnabled: false,
    consentGiven: false,
    consentTimestamp: null,
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', user.uid), newUser)
}

export async function getUserDoc(uid: string): Promise<User | null> {
  const ref = userDoc(db, uid)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return null
  return snapshot.data()
}

export async function recordConsent(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    consentGiven: true,
    consentTimestamp: serverTimestamp(),
  })
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}
