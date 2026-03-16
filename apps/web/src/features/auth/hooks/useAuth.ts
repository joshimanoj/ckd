import { useEffect, useState } from 'react'
import { collection, query, limit, getDocs } from 'firebase/firestore'
import { db } from '@ckd/shared/firebase/config'
import { useAuthStore } from '../../../shared/store/authStore'
import { subscribeToAuthState, getUserDoc } from '../services/authService'
import type { User as FirebaseUser } from 'firebase/auth'

type RouteTo = 'sign-in' | 'consent' | 'profile' | 'library'

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
  const { user, loading, setUser, setLoading } = useAuthStore()
  const [routeTo, setRouteTo] = useState<RouteTo>('sign-in')

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      const route = await resolveRouteTo(firebaseUser)
      setUser(firebaseUser)
      setLoading(false)
      setRouteTo(route)
    })
    return unsubscribe
  }, [setUser, setLoading])

  return { user, loading, routeTo }
}
