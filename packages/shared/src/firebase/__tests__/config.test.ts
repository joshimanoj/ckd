import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ type: 'auth' })),
  connectAuthEmulator: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ type: 'firestore' })),
  connectFirestoreEmulator: vi.fn(),
}))

describe('Firebase config', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('should initialise Firebase once and export auth and db instances', async () => {
    const { initializeApp, getApps } = await import('firebase/app')
    const mockedGetApps = vi.mocked(getApps)
    mockedGetApps.mockReturnValueOnce([])

    const { auth, db } = await import('../config')

    expect(auth).toBeDefined()
    expect(auth).not.toBeNull()
    expect(db).toBeDefined()
    expect(db).not.toBeNull()
    expect(initializeApp).toHaveBeenCalledTimes(1)
  })

  it('should not create two Firebase apps when imported twice', async () => {
    const { initializeApp, getApps } = await import('firebase/app')
    const mockedGetApps = vi.mocked(getApps)
    // Second import: app already exists
    mockedGetApps.mockReturnValueOnce([{ name: '[DEFAULT]' }] as ReturnType<typeof getApps>)

    await import('../config')

    // initializeApp should not have been called again (getApp used instead)
    expect(initializeApp).toHaveBeenCalledTimes(0)
  })
})
