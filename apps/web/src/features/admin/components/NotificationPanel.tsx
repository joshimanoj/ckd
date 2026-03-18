import { useState } from 'react'
import type { Notification } from '@ckd/shared/types/notification'
import type { AddNotificationInput } from '../services/adminService'

interface Props {
  onSend: (input: AddNotificationInput) => Promise<void>
  latestNotification: Notification | null
  notificationLoading: boolean
}

function statusColor(status: Notification['status']): string {
  if (status === 'sent') return '#22C55E'
  if (status === 'failed') return '#EF4444'
  return '#6B7280'
}

function statusText(status: Notification['status']): string {
  if (status === 'sent') return 'Sent'
  if (status === 'failed') return 'Failed to send'
  return 'Sending…'
}

export function NotificationPanel({ onSend, latestNotification, notificationLoading }: Props) {
  const [title, setTitle] = useState('New rhyme added!')
  const [body, setBody] = useState('')
  const [videoId, setVideoId] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    try {
      await onSend({
        title,
        body,
        youtubeVideoId: videoId.trim() || null,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="ckd-card" style={{ marginTop: 20, padding: 20, borderRadius: 16 }}>
      <p style={{ margin: '0 0 12px', color: '#1E1B4B', font: "700 16px 'Baloo 2', cursive" }}>Send Notification</p>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#6B7280', font: "600 13px 'Nunito', sans-serif" }}>Title</label>
          <input data-testid="input-notif-title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 14, font: "15px 'Nunito', sans-serif" }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#6B7280', font: "600 13px 'Nunito', sans-serif" }}>Body</label>
          <textarea data-testid="input-notif-body" value={body} onChange={(e) => setBody(e.target.value)} style={{ width: '100%', minHeight: 80, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 14, font: "15px 'Nunito', sans-serif", resize: 'vertical' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#6B7280', font: "600 13px 'Nunito', sans-serif" }}>YouTube Video ID (optional)</label>
          <input data-testid="input-notif-videoid" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="e.g. dQw4w9WgXcQ" style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 14, font: "15px 'Nunito', sans-serif" }} />
        </div>

        <button
          data-testid="btn-send-notif"
          disabled={sending || notificationLoading}
          onClick={() => void handleSend()}
          className="ckd-btn-primary"
          style={{ width: '100%', opacity: sending || notificationLoading ? 0.7 : 1 }}
        >
          {sending ? 'Sending…' : '🔔 Send Push Notification'}
        </button>

        {latestNotification ? (
          <p data-testid="notification-status" style={{ margin: 0, color: statusColor(latestNotification.status), font: "14px 'Nunito', sans-serif" }}>
            {statusText(latestNotification.status)}
          </p>
        ) : null}
      </div>
    </div>
  )
}
