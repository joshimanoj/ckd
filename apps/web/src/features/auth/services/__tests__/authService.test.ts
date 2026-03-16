import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User as FirebaseUser } from 'firebase/auth'

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  GoogleAuthProvider: class { scopes: string[] = [] },
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(() => ({ path: 'users/test-uid' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
  collection: vi.fn(),
}))

// Mock shared firebase config
vi.mock('@ckd/shared/firebase/config', () => ({
  auth: { currentUser: null },
  db: {},
}))

// Mock shared collections
vi.mock('@ckd/shared/firebase/collections', () => ({
  userDoc: vi.fn(() => ({ path: 'users/test-uid' })),
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should write user doc with correct defaults and not overwrite on re-call', async () => {
    const { getDoc, setDoc } = await import('firebase/firestore')
    const mockedGetDoc = vi.mocked(getDoc)
    const mockedSetDoc = vi.mocked(setDoc)

    // First call: doc does not exist
    mockedGetDoc.mockResolvedValueOnce({ exists: () => false } as ReturnType<typeof getDoc>)
    mockedSetDoc.mockResolvedValueOnce(undefined)

    const { createUserDoc, getUserDoc } = await import('../authService')
    const mockUser = { uid: 'test-uid', email: 'test@example.com', displayName: 'Test' } as FirebaseUser

    await createUserDoc(mockUser)

    expect(mockedSetDoc).toHaveBeenCalledTimes(1)
    const writeCall = mockedSetDoc.mock.calls[0]
    const writtenData = writeCall[1] as Record<string, unknown>
    expect(writtenData['consentGiven']).toBe(false)
    expect(writtenData['notificationsEnabled']).toBe(false)
    expect(writtenData['fcmToken']).toBeNull()

    // Second call: doc already exists → should NOT write again
    vi.clearAllMocks()
    mockedGetDoc.mockResolvedValueOnce({ exists: () => true } as ReturnType<typeof getDoc>)
    await createUserDoc(mockUser)
    expect(mockedSetDoc).not.toHaveBeenCalled()

    // getUserDoc: returns null when doc does not exist
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as ReturnType<typeof getDoc>)
    const result = await getUserDoc('test-uid')
    expect(result).toBeNull()
  })
})
