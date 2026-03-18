import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { User as FirebaseUser } from 'firebase/auth'

// Mock authService
vi.mock('../../services/authService', () => ({
  subscribeToAuthState: vi.fn(),
  getUserDoc: vi.fn(),
  createUserDoc: vi.fn().mockResolvedValue(undefined),
  refreshFcmTokenAfterSignIn: vi.fn().mockResolvedValue(undefined),
}))

// Mock firebase/firestore for childProfiles query
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(() => ({ withConverter: vi.fn(() => 'collection-ref') })),
  query: vi.fn((ref) => ref),
  limit: vi.fn(() => 'limit-1'),
  getDocs: vi.fn(),
}))

// Mock shared firebase config
vi.mock('@ckd/shared/firebase/config', () => ({
  auth: {},
  db: {},
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return correct routeTo based on auth state and Firestore user document', async () => {
    const { subscribeToAuthState, getUserDoc } = await import('../../services/authService')
    const { getDocs } = await import('firebase/firestore')
    const mockedSubscribe = vi.mocked(subscribeToAuthState)
    const mockedGetUserDoc = vi.mocked(getUserDoc)
    const mockedGetDocs = vi.mocked(getDocs)

    // Scenario 1: no user → routeTo === 'sign-in'
    let capturedCallback: ((user: FirebaseUser | null) => void) | null = null
    mockedSubscribe.mockImplementation((cb) => {
      capturedCallback = cb
      return () => {}
    })

    const { useAuth } = await import('../useAuth')
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      capturedCallback!(null)
    })

    expect(result.current.routeTo).toBe('sign-in')
    expect(result.current.loading).toBe(false)

    // Scenario 2: user with consentGiven: false → routeTo === 'consent'
    const mockUser = { uid: 'user1' } as FirebaseUser
    mockedGetUserDoc.mockResolvedValueOnce({
      uid: 'user1',
      email: 'test@test.com',
      displayName: 'Test',
      fcmToken: null,
      notificationsEnabled: false,
      consentGiven: false,
      consentTimestamp: null,
      createdAt: { toDate: () => new Date() } as unknown,
    } as Awaited<ReturnType<typeof getUserDoc>>)

    await act(async () => {
      capturedCallback!(mockUser)
    })

    expect(result.current.routeTo).toBe('consent')

    // Scenario 3: sign out first (resets previousUser), then sign in with consentGiven:true
    await act(async () => {
      capturedCallback!(null)
    })

    mockedGetUserDoc.mockResolvedValueOnce({
      uid: 'user1',
      email: 'test@test.com',
      displayName: 'Test',
      fcmToken: null,
      notificationsEnabled: false,
      consentGiven: true,
      consentTimestamp: null,
      createdAt: { toDate: () => new Date() } as unknown,
    } as Awaited<ReturnType<typeof getUserDoc>>)
    mockedGetDocs.mockResolvedValueOnce({ empty: true, docs: [] } as unknown as ReturnType<typeof getDocs>)

    await act(async () => {
      capturedCallback!(mockUser)
    })

    expect(result.current.routeTo).toBe('profile')

    // Scenario 4: sign out first, then sign in with child profile
    await act(async () => {
      capturedCallback!(null)
    })

    mockedGetUserDoc.mockResolvedValueOnce({
      uid: 'user1',
      email: 'test@test.com',
      displayName: 'Test',
      fcmToken: null,
      notificationsEnabled: false,
      consentGiven: true,
      consentTimestamp: null,
      createdAt: { toDate: () => new Date() } as unknown,
    } as Awaited<ReturnType<typeof getUserDoc>>)
    mockedGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'profile1', data: () => ({ name: 'Test Child' }) }],
    } as unknown as ReturnType<typeof getDocs>)

    await act(async () => {
      capturedCallback!(mockUser)
    })

    expect(result.current.routeTo).toBe('library')
  })
})
