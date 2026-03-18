import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

initializeApp()
const db = getFirestore()

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export const onNotificationCreated = onDocumentCreated(
  'notifications/{notificationId}',
  async (event) => {
    const data = event.data?.data()
    if (!data) return

    const { title, body } = data as { title: string; body: string }

    const usersSnap = await db.collection('users')
      .where('notificationsEnabled', '==', true).get()

    const tokens: string[] = usersSnap.docs
      .map((d) => d.data()['fcmToken'] as string | null)
      .filter((t): t is string => Boolean(t))

    let status: 'sent' | 'failed' = 'sent'
    try {
      for (const chunk of chunkArray(tokens, 500)) {
        await getMessaging().sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
        })
      }
    } catch {
      status = 'failed'
    }

    await event.data!.ref.update({
      sentAt: FieldValue.serverTimestamp(),
      status,
    })
  },
)
