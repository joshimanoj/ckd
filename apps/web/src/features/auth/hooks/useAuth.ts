import { useEffect } from 'react'
import { collection, query, limit, getDocs } from 'firebase/firestore'
import { db } from '@ckd/shared/firebase/config'
import { useAuthStore } from '../../../shared/store/authStore'
import type { RouteTo } from '../../../shared/store/authStore'
import { subscribeToAuthState, getUserDoc, createUserDoc } from '../services/authService'
import type { User as FirebaseUser } from 'firebase/auth'

async function checkChildProfileExists(uid: string): Promise<boolean> {
  const q = query(collection(db, 'users', uid, 'childProfiles'), limit(1))
  const snap = await getDocs(q)
  return !snap.empty
}

async function resolveRouteTo(user: FirebaseUser | null): Promise<RouteTo> {
  if (!user) return 'sign-in'

  const userDoc = await getUserDoc(user.uid)
  if (!userDoc || !userDoc.consentGiven) return 'consent'

  const hasProfile = await checkChildProfileExists(user.uid)
  return hasProfile ? 'library' : 'profile'
}

interface AuthResult {
  user: FirebaseUser | null
  loading: boolean
  routeTo: RouteTo
}

export function useAuth(): AuthResult {
  const { user, loading, routeTo, setUser, setLoading, setRouteTo } = useAuthStore()

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      const previousUser = useAuthStore.getState().user

      if (firebaseUser) await createUserDoc(firebaseUser)

      // Only re-resolve route when auth state actually changes (sign-in / sign-out).
      // Skip re-resolution when the same user is already resolved — this prevents
      // stale Firestore reads from overwriting an explicitly-set routeTo (e.g. after
      // recording consent in ConsentModal).
      const sameUser = previousUser?.uid === firebaseUser?.uid && firebaseUser !== null
      if (!sameUser) {
        const route = await resolveRouteTo(firebaseUser)
        setRouteTo(route)
      }

      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [setUser, setLoading, setRouteTo])

  return { user, loading, routeTo }
}
