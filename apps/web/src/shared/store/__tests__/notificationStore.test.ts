import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationStore } from '../notificationStore'

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notificationsEnabled: false,
      fcmToken: null,
      promptShown: false,
    })
  })

  it('should initialise with notificationsEnabled: false', () => {
    expect(useNotificationStore.getState().notificationsEnabled).toBe(false)
  })

  it('should initialise with fcmToken: null', () => {
    expect(useNotificationStore.getState().fcmToken).toBeNull()
  })

  it('should initialise with promptShown: false', () => {
    expect(useNotificationStore.getState().promptShown).toBe(false)
  })

  it('should update notificationsEnabled via setNotificationsEnabled', () => {
    useNotificationStore.getState().setNotificationsEnabled(true)
    expect(useNotificationStore.getState().notificationsEnabled).toBe(true)
    useNotificationStore.getState().setNotificationsEnabled(false)
    expect(useNotificationStore.getState().notificationsEnabled).toBe(false)
  })

  it('should update fcmToken via setFcmToken', () => {
    useNotificationStore.getState().setFcmToken('test-token-123')
    expect(useNotificationStore.getState().fcmToken).toBe('test-token-123')
    useNotificationStore.getState().setFcmToken(null)
    expect(useNotificationStore.getState().fcmToken).toBeNull()
  })

  it('should update promptShown via setPromptShown', () => {
    useNotificationStore.getState().setPromptShown(true)
    expect(useNotificationStore.getState().promptShown).toBe(true)
  })
})
