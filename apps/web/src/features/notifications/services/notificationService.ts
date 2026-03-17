import { getMessaging, getToken } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { app, db } from '@ckd/shared/firebase/config'

export async function requestWebFcmToken(): Promise<string | null> {
  // Test hook — injected by Playwright via page.addInitScript
  const testToken = (window as unknown as Record<string, unknown>)['__mockFcmToken']
  if (testToken) return testToken as string

  if (typeof Notification === 'undefined') return null
  if (Notification.permission !== 'granted') return null

  try {
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: import.meta.env['VITE_VAPID_KEY'] as string,
      serviceWorkerRegistration: swReg,
    })
    return token || null
  } catch {
    return null
  }
}

export async function writeFcmToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { fcmToken: token })
}

export async function updateNotificationsEnabled(
  uid: string,
  enabled: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { notificationsEnabled: enabled })
}
