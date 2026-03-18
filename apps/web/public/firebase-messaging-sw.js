// Firebase Cloud Messaging service worker
// Required for web push notifications — must be at root origin (/firebase-messaging-sw.js)
// Firebase config values are intentionally public (security is via Firestore Security Rules)

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

// Firebase config injected at runtime via self.__FIREBASE_CONFIG (set by main app) or env vars
// For V1: values are read from self registration context — the main app sets them via postMessage
// or they are inlined at build time via a build script.
// Service workers cannot access import.meta.env directly, so values are passed via
// a dedicated config endpoint or inlined. For V1 simplicity, we use self.<VAR> pattern
// and rely on the build pipeline to inject them.

const firebaseConfig = {
  apiKey: 'AIzaSyC109x04aHG4ul9DsrCOOO5PqS3Jdopx-c',
  authDomain: 'chotikiduniya-831e8.firebaseapp.com',
  projectId: 'chotikiduniya-831e8',
  storageBucket: 'chotikiduniya-831e8.firebasestorage.app',
  messagingSenderId: '48657234109',
  appId: '1:48657234109:web:32786dbc9a55e9faa55fd4',
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// Handle push messages received when browser tab is not in focus
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'Choti Ki Duniya'
  const body = payload.notification?.body ?? ''
  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
  })
})

// Notification click → bring focus to existing tab or open /library
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate('/library')
            return client.focus()
          }
        }
        return clients.openWindow('/library')
      }),
  )
})
