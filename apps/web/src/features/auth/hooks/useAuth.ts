import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../../../shared/store/authStore'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
import { useVideoStore } from '../../../shared/store/videoStore'
import { useWatchSessionStore } from '../../../shared/store/watchSessionStore'
import { useNotificationStore } from '../../../shared/store/notificationStore'
import type { RouteTo } from '../../../shared/store/authStore'
import {
  subscribeToAuthState,
  getUserDoc,
  createUserDoc,
  refreshFcmTokenAfterSignIn,
  signOutUser,
} from '../services/authService'
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
  signOut: () => Promise<void>
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
        // Refresh FCM token on sign-in (token may have rotated)
        if (firebaseUser) {
          refreshFcmTokenAfterSignIn(firebaseUser.uid).catch(() => undefined)
        }
      }

      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [setUser, setLoading, setRouteTo])

  // Clear all stores and sign out. Firebase sign-out MUST be awaited before authStore
  // is cleared so that the Firebase session is revoked before any redirect occurs.
  // onAuthStateChanged(null) fires after signOutUser() resolves and drives the
  // AuthGuard redirect — this prevents the race where a page reload after redirect
  // still finds a valid Firebase session in IndexedDB.
  const signOut = useCallback(async () => {
    useChildProfileStore.getState().clearActiveProfile()
    useVideoStore.getState().reset()
    useWatchSessionStore.getState().resetSession()
    useNotificationStore.getState().reset()
    await signOutUser()
    // authStore is updated by onAuthStateChanged(null) after signOutUser() resolves
  }, [])

  return { user, loading, routeTo, signOut }
}
