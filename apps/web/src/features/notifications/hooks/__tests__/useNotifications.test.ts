import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../services/notificationService', () => ({
  requestWebFcmToken: vi.fn(),
  writeFcmToken: vi.fn().mockResolvedValue(undefined),
  updateNotificationsEnabled: vi.fn().mockResolvedValue(undefined),
}))

import {
  requestWebFcmToken,
  writeFcmToken,
  updateNotificationsEnabled,
} from '../../services/notificationService'
import { useNotifications } from '../useNotifications'
import { useNotificationStore } from '../../../../shared/store/notificationStore'

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationStore.setState({ notificationsEnabled: false, fcmToken: null, promptShown: false })
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('default') },
      writable: true,
      configurable: true,
    })
  })

  it('should call requestWebFcmToken on mount when Notification.permission is "granted"', async () => {
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    })
    vi.mocked(requestWebFcmToken).mockResolvedValue('token-on-mount')

    const { unmount } = renderHook(() => useNotifications('uid-123'))
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(requestWebFcmToken).toHaveBeenCalledOnce()
    unmount()
  })

  it('should NOT call requestWebFcmToken when uid is empty', async () => {
    renderHook(() => useNotifications(''))
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(requestWebFcmToken).not.toHaveBeenCalled()
  })

  it('should update Firestore and store when token changes on mount', async () => {
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    })
    vi.mocked(requestWebFcmToken).mockResolvedValue('new-token-456')

    renderHook(() => useNotifications('uid-abc'))
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(writeFcmToken).toHaveBeenCalledWith('uid-abc', 'new-token-456')
    expect(useNotificationStore.getState().fcmToken).toBe('new-token-456')
  })

  describe('optIn()', () => {
    it('should call requestPermission, writeFcmToken, updateNotificationsEnabled on grant', async () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted'),
        },
        writable: true,
        configurable: true,
      })
      vi.mocked(requestWebFcmToken).mockResolvedValue('opt-in-token')

      const { result } = renderHook(() => useNotifications('uid-optIn'))
      await act(async () => {
        await result.current.optIn()
      })

      expect(writeFcmToken).toHaveBeenCalledWith('uid-optIn', 'opt-in-token')
      expect(updateNotificationsEnabled).toHaveBeenCalledWith('uid-optIn', true)
      expect(useNotificationStore.getState().notificationsEnabled).toBe(true)
    })

    it('should NOT update store if permission is denied', async () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('denied'),
        },
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useNotifications('uid-denied'))
      await act(async () => {
        await result.current.optIn()
      })

      expect(updateNotificationsEnabled).not.toHaveBeenCalled()
      expect(useNotificationStore.getState().notificationsEnabled).toBe(false)
    })
  })

  describe('optOut()', () => {
    it('should call updateNotificationsEnabled(false) and update store', async () => {
      useNotificationStore.setState({ notificationsEnabled: true, fcmToken: 'tok', promptShown: false })

      const { result } = renderHook(() => useNotifications('uid-optOut'))
      await act(async () => {
        await result.current.optOut()
      })

      expect(updateNotificationsEnabled).toHaveBeenCalledWith('uid-optOut', false)
      expect(useNotificationStore.getState().notificationsEnabled).toBe(false)
    })
  })
})
