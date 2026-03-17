import { useState } from 'react'

interface NotificationOptInSheetProps {
  visible: boolean
  onAccept: () => Promise<void>
  onDismiss: () => void
}

export function NotificationOptInSheet({
  visible,
  onAccept,
  onDismiss,
}: NotificationOptInSheetProps) {
  const [loading, setLoading] = useState(false)

  if (!visible) return null

  const handleAccept = async () => {
    setLoading(true)
    try {
      await onAccept()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes slide-up-sheet {
          from { transform: translateY(100%) }
          to   { transform: translateY(0) }
        }
      `}</style>

      {/* Backdrop */}
      <div
        data-testid="notif-overlay"
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 300,
        }}
      />

      {/* Sheet */}
      <div
        data-testid="notif-optin-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FAFAFA',
          borderRadius: '24px 24px 0 0',
          zIndex: 301,
          padding: '0 16px 32px',
          animation: 'slide-up-sheet 300ms ease-out',
          maxWidth: '100vw',
          boxSizing: 'border-box',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 40, height: 4, background: '#D1D5DB', borderRadius: 2 }} />
        </div>

        {/* Bell icon */}
        <div style={{ textAlign: 'center', fontSize: 32, color: '#9333EA', margin: '8px 0 4px' }}>
          🔔
        </div>

        {/* Title */}
        <p
          style={{
            margin: '8px 0 0',
            textAlign: 'center',
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: '#1E1B4B',
          }}
        >
          Get notified about new rhymes!
        </p>

        {/* Subtitle */}
        <p
          style={{
            margin: '8px 8px 20px',
            textAlign: 'center',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 400,
            fontSize: 14,
            color: '#6B7280',
          }}
        >
          We'll let you know when new videos are added.
        </p>

        {/* "Yes, notify me" — primary */}
        <button
          data-testid="notif-accept-btn"
          onClick={handleAccept}
          disabled={loading}
          style={{
            display: 'block',
            width: '100%',
            minHeight: '48px',
            background: '#F43F5E',
            border: 'none',
            borderRadius: 24,
            color: '#fff',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        >
          {loading ? '…' : 'Yes, notify me'}
        </button>

        {/* "Not now" — ghost */}
        <button
          data-testid="notif-dismiss-btn"
          onClick={onDismiss}
          disabled={loading}
          style={{
            display: 'block',
            width: '100%',
            minHeight: '48px',
            background: 'transparent',
            border: 'none',
            borderRadius: 24,
            color: '#7C3AED',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxSizing: 'border-box',
          }}
        >
          Not now
        </button>
      </div>
    </>
  )
}
