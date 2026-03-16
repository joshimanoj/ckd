import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import type { User as FirebaseUser } from 'firebase/auth'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true })
  })

  it('should initialise with null user and loading true; update correctly on setUser/setLoading', () => {
    const { user, loading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(loading).toBe(true)

    const mockUser = { uid: 'test-uid', email: 'test@example.com' } as FirebaseUser
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)

    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().loading).toBe(false)
  })
})
