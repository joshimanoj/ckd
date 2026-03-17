import { useState } from 'react'
import type { Notification } from '@ckd/shared/types/notification'
import type { AddNotificationInput } from '../services/adminService'

interface Props {
  onSend: (input: AddNotificationInput) => Promise<void>
  latestNotification: Notification | null
  notificationLoading: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  fontFamily: "'Nunito', sans-serif",
  fontSize: 15,
  color: '#1E1B4B',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Nunito', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: '#6B7280',
  marginBottom: 4,
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
    <div
      style={{
        marginTop: 32,
        background: '#F3E8FF',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <h3
        style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: '#1E1B4B',
          margin: 0,
        }}
      >
        Send Notification
      </h3>

      <div>
        <label style={labelStyle}>Title</label>
        <input
          data-testid="input-notif-title"
          style={inputStyle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Body</label>
        <textarea
          data-testid="input-notif-body"
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>YouTube Video ID (optional)</label>
        <input
          data-testid="input-notif-videoid"
          style={inputStyle}
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="e.g. dQw4w9WgXcQ"
        />
      </div>

      <button
        data-testid="btn-send-notif"
        disabled={sending || notificationLoading}
        onClick={() => void handleSend()}
        style={{
          height: 44,
          background: sending || notificationLoading ? '#F9A8B5' : '#F43F5E',
          color: 'white',
          border: 'none',
          borderRadius: 24,
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          fontSize: 16,
          cursor: sending || notificationLoading ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
          padding: '0 32px',
        }}
      >
        {sending ? 'Sending…' : 'Send'}
      </button>

      {latestNotification && (
        <p
          data-testid="notification-status"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 14,
            color: statusColor(latestNotification.status),
            margin: 0,
          }}
        >
          {statusText(latestNotification.status)}
        </p>
      )}
    </div>
  )
}
