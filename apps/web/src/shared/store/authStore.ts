import { create } from 'zustand'
import type { User as FirebaseUser } from 'firebase/auth'

export type RouteTo = 'sign-in' | 'consent' | 'profile' | 'library'

interface AuthState {
  user: FirebaseUser | null
  loading: boolean
  routeTo: RouteTo
  setUser: (user: FirebaseUser | null) => void
  setLoading: (loading: boolean) => void
  setRouteTo: (routeTo: RouteTo) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  routeTo: 'sign-in',
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setRouteTo: (routeTo) => set({ routeTo }),
}))
