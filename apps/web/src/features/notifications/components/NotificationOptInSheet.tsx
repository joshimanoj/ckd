import { useState } from 'react'

interface NotificationOptInSheetProps {
  visible: boolean
  onAccept: () => Promise<void>
  onDismiss: () => void
}

export function NotificationOptInSheet({ visible, onAccept, onDismiss }: NotificationOptInSheetProps) {
  const [loading, setLoading] = useState(false)

  if (!visible) return null

  async function handleAccept() {
    setLoading(true)
    try {
      await onAccept()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div data-testid="notif-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} onClick={onDismiss} />
      <div data-testid="notif-optin-sheet" className="ckd-bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ckd-sheet-handle" />
        <div style={{ textAlign: 'center', fontSize: 32, color: '#9333EA', marginBottom: 8 }}>🔔</div>
        <p style={{ margin: 0, textAlign: 'center', color: '#1E1B4B', font: "700 20px 'Baloo 2', cursive" }}>
          Get notified about new rhymes!
        </p>
        <p style={{ margin: '8px 8px 20px', textAlign: 'center', color: '#6B7280', font: "400 14px 'Nunito', sans-serif" }}>
          We&apos;ll let you know when new videos are added.
        </p>
        <button
          data-testid="notif-accept-btn"
          className="ckd-btn-primary"
          disabled={loading}
          onClick={handleAccept}
          style={{ width: '100%', minHeight: '48px', marginBottom: 12, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '…' : 'Yes, notify me'}
        </button>
        <button
          data-testid="notif-dismiss-btn"
          className="ckd-btn-ghost"
          disabled={loading}
          onClick={onDismiss}
          style={{ width: '100%' }}
        >
          Not now
        </button>
      </div>
    </>
  )
}
