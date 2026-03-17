import { useEffect } from 'react'
import { useAuthStore } from '../../../shared/store/authStore'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
import type { RouteTo } from '../../../shared/store/authStore'
import { subscribeToAuthState, getUserDoc, createUserDoc } from '../services/authService'
import { getChildProfiles } from '../../childProfile/services/childProfileService'
import type { User as FirebaseUser } from 'firebase/auth'

async function resolveRouteTo(user: FirebaseUser | null): Promise<RouteTo> {
  if (!user) return 'sign-in'

  const userDoc = await getUserDoc(user.uid)
  if (!userDoc || !userDoc.consentGiven) return 'consent'

  const profiles = await getChildProfiles(user.uid)
  if (profiles.length > 0) {
    // Hydrate the active profile so WatchPage can write watch sessions
    useChildProfileStore.getState().setActiveProfile(profiles[0])
    return 'library'
  }
  return 'profile'
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
