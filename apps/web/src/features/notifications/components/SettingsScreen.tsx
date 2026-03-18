import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useParentalGate } from '../../../shared/hooks/useParentalGate'
import { ParentalGate } from '../../parentalGate/components/ParentalGate'

interface SettingsScreenProps {
  uid: string
  onSignOut: () => Promise<void>
}

const PRIVACY_POLICY_URL = (import.meta.env.VITE_PRIVACY_POLICY_URL as string | undefined) ?? '#'

export function SettingsScreen({ uid, onSignOut: _onSignOut }: SettingsScreenProps) {
  const { notificationsEnabled, setEnabled } = useNotifications(uid)
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const [shaking, setShaking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function handleToggleTap() {
    showGate()
  }

  async function handleGateConfirm(answer: string) {
    const correct = checkAnswer(answer)
    if (!correct) {
      setShaking(true)
      setTimeout(() => setShaking(false), 300)
      return
    }
    hideGate()
    await setEnabled(!notificationsEnabled)
    setToast(notificationsEnabled ? 'Notifications turned off' : 'Notifications turned on')
    setTimeout(() => setToast(null), 3000)
  }

  function handleGateDismiss() {
    hideGate()
  }

  return (
    <div data-testid="settings-screen" style={{ padding: '16px 20px' }}>
      {/* Notifications section */}
      <p style={{
        fontFamily: "'Baloo 2', sans-serif",
        fontWeight: 700,
        fontSize: 16,
        color: '#1E1B4B',
        margin: '0 0 12px 0',
      }}>
        Notifications
      </p>

      {/* Toggle row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        marginBottom: 8,
      }}>
        <div>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: '#1E1B4B',
            margin: 0,
          }}>
            New video notifications
          </p>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 13,
            color: '#6B7280',
            margin: '2px 0 0 0',
          }}>
            Get notified when new rhymes are added
          </p>
        </div>
        <input
          data-testid="notif-toggle"
          type="checkbox"
          role="switch"
          checked={notificationsEnabled}
          readOnly
          onClick={handleToggleTap}
          style={{ width: 44, height: 24, cursor: 'pointer' }}
        />
      </div>

      {/* Lock note */}
      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 13,
        color: '#6B7280',
        margin: '0 0 20px 4px',
      }}>
        🔒 Requires parent verification
      </p>

      {/* Privacy Policy row */}
      <a
        data-testid="privacy-policy-link"
        href={PRIVACY_POLICY_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 48,
          padding: '0 4px',
          fontFamily: "'Nunito', sans-serif",
          fontSize: 15,
          color: '#9333EA',
          textDecoration: 'underline',
          textDecorationColor: '#9333EA',
        }}
      >
        Privacy Policy
        <span style={{ textDecoration: 'none' }}>›</span>
      </a>

      {/* Parental Gate */}
      <ParentalGate
        visible={isVisible}
        question={currentQuestion.question}
        onConfirm={handleGateConfirm}
        onDismiss={handleGateDismiss}
        shaking={shaking}
      />

      {/* Success toast */}
      {toast && (
        <div
          data-testid="settings-toast"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#22C55E',
            color: '#fff',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 24,
            padding: '10px 20px',
            zIndex: 500,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
