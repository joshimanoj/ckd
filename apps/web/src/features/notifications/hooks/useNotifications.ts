import { useEffect, useCallback } from 'react'
import { useNotificationStore } from '../../../shared/store/notificationStore'
import {
  requestWebFcmToken,
  writeFcmToken,
  updateNotificationsEnabled,
} from '../services/notificationService'

export function useNotifications(uid: string) {
  const { notificationsEnabled, fcmToken, setNotificationsEnabled, setFcmToken } =
    useNotificationStore()

  // On mount: refresh token if permission already granted
  useEffect(() => {
    if (!uid) return
    let cancelled = false

    async function refreshToken() {
      const token = await requestWebFcmToken()
      if (cancelled || !token) return
      if (token !== fcmToken) {
        await writeFcmToken(uid, token)
        if (!cancelled) setFcmToken(token)
      }
    }

    refreshToken()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const optIn = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return
    const token = await requestWebFcmToken()
    if (!token) return
    await writeFcmToken(uid, token)
    await updateNotificationsEnabled(uid, true)
    setFcmToken(token)
    setNotificationsEnabled(true)
  }, [uid, setFcmToken, setNotificationsEnabled])

  const optOut = useCallback(async () => {
    await updateNotificationsEnabled(uid, false)
    setNotificationsEnabled(false)
  }, [uid, setNotificationsEnabled])

  return { notificationsEnabled, optIn, optOut }
}
