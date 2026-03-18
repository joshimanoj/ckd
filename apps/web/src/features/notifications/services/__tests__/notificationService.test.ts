import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase/app before importing service
vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({})),
}))

// Mock firebase/messaging before importing service
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({ app: {} })),
  getToken: vi.fn(),
}))

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    updateDoc: vi.fn().mockResolvedValue(undefined),
    doc: vi.fn((db, ...path) => ({ path: path.join('/') })),
  }
})

vi.mock('@ckd/shared/firebase/config', () => ({
  db: {},
}))

import { getToken } from 'firebase/messaging'
import { updateDoc } from 'firebase/firestore'
import {
  requestWebFcmToken,
  writeFcmToken,
  updateNotificationsEnabled,
} from '../notificationService'

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Remove test hook from window
    delete (window as unknown as Record<string, unknown>)['__mockFcmToken']
    // Reset Notification permission mock
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    })
  })

  describe('requestWebFcmToken', () => {
    it('should return mock token when window.__mockFcmToken is set', async () => {
      ;(window as unknown as Record<string, unknown>)['__mockFcmToken'] = 'mock-test-token'
      const token = await requestWebFcmToken()
      expect(token).toBe('mock-test-token')
      expect(getToken).not.toHaveBeenCalled()
    })

    it('should return null when Notification.permission is "denied"', async () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      })
      const token = await requestWebFcmToken()
      expect(token).toBeNull()
    })

    it('should return null when Notification.permission is "default"', async () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      })
      const token = await requestWebFcmToken()
      expect(token).toBeNull()
    })

    it('should call getToken when Notification.permission is "granted"', async () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'granted' },
        writable: true,
        configurable: true,
      })
      // Mock service worker registration
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: vi.fn().mockResolvedValue({ scope: '/' }) },
        writable: true,
        configurable: true,
      })
      vi.mocked(getToken).mockResolvedValue('real-fcm-token')

      const token = await requestWebFcmToken()
      expect(token).toBe('real-fcm-token')
      expect(getToken).toHaveBeenCalledOnce()
    })
  })

  describe('writeFcmToken', () => {
    it('should call updateDoc with correct path and fcmToken field', async () => {
      await writeFcmToken('user-123', 'token-abc')
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'users/user-123' }),
        { fcmToken: 'token-abc' },
      )
    })
  })

  describe('updateNotificationsEnabled', () => {
    it('should call updateDoc with notificationsEnabled: true', async () => {
      await updateNotificationsEnabled('user-456', true)
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'users/user-456' }),
        { notificationsEnabled: true },
      )
    })

    it('should call updateDoc with notificationsEnabled: false', async () => {
      await updateNotificationsEnabled('user-456', false)
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'users/user-456' }),
        { notificationsEnabled: false },
      )
    })
  })
})
