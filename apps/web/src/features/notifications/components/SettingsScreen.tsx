import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useParentalGate } from '../../../shared/hooks/useParentalGate'
import { ParentalGate } from '../../parentalGate/components/ParentalGate'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
import { useAuthStore } from '../../../shared/store/authStore'
import type { Timestamp } from 'firebase/firestore'

interface SettingsScreenProps {
  uid: string
  onSignOut: () => Promise<void>
}

const PRIVACY_POLICY_URL = (import.meta.env.VITE_PRIVACY_POLICY_URL as string | undefined) ?? '#'
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '1.0.0'

function calcAge(dob: Timestamp): number {
  const now = new Date()
  const birth = dob.toDate()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800,
  fontSize: 12,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 12px 8px',
}

const card: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: '#fff',
  borderRadius: 22,
  padding: '17px 18px',
  boxShadow: '0 18px 34px rgba(147, 51, 234, 0.08)',
  gap: 16,
}

const iconBox = (bg: string): React.CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 16,
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  flexShrink: 0,
})

export function SettingsScreen({ uid, onSignOut }: SettingsScreenProps) {
  const { notificationsEnabled, setEnabled } = useNotifications(uid)
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const [shaking, setShaking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  const activeProfile = useChildProfileStore((s) => s.activeProfile)
  const user = useAuthStore((s) => s.user)

  const childAge = activeProfile ? calcAge(activeProfile.dateOfBirth) : null
  const providerLabel =
    user?.providerData[0]?.providerId === 'google.com' ? 'Signed in with Google' : 'Signed in with Email'

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

  async function handleSignOutConfirm() {
    setShowSignOutDialog(false)
    await onSignOut()
  }

  return (
    <div
      data-testid="settings-screen"
      style={{
        padding: '24px 20px 28px',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        background: 'transparent',
      }}
    >

      {/* NOTIFICATIONS */}
      <p style={sectionLabel}>Notifications</p>
      <div style={{ ...card, marginBottom: 28 }}>
        <div style={iconBox('#F3E8FF')}>🔔</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 16, color: '#27235C', margin: 0, lineHeight: 1.05 }}>
            New video alerts
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#667085', margin: '6px 0 0 0', lineHeight: 1.35 }}>
            Get notified when new content is added
          </p>
        </div>
        {/* Styled toggle switch */}
        <button
          data-testid="notif-toggle"
          type="button"
          role="switch"
          aria-checked={notificationsEnabled}
          onClick={handleToggleTap}
          style={{
            width: 68,
            height: 38,
            borderRadius: 999,
            background: notificationsEnabled ? 'linear-gradient(90deg, #9333EA 0%, #7C3AED 100%)' : '#D1D5DB',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 200ms',
            flexShrink: 0,
            border: 'none',
            padding: 0,
          }}
        >
          <div style={{
            position: 'absolute',
            top: 4,
            left: notificationsEnabled ? 34 : 4,
            width: 30,
            height: 30,
            background: '#fff',
            borderRadius: '50%',
            transition: 'left 200ms',
            boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
          }} />
        </button>
      </div>

      {/* CHILD PROFILE */}
      {activeProfile && (
        <>
          <p style={sectionLabel}>Child Profile</p>
          <div style={{ ...card, marginBottom: 28 }}>
            <div style={iconBox('#F3E8FF')}>🧒</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 16, color: '#27235C', margin: 0, lineHeight: 1.05 }}>
                {activeProfile.name}
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#667085', margin: '6px 0 0 0', lineHeight: 1.35 }}>
                {childAge !== null ? `Age ${childAge} · Updated today` : 'Updated today'}
              </p>
            </div>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: '#9333EA',
              cursor: 'pointer',
            }}>
              Edit
            </span>
          </div>
        </>
      )}

      {/* ACCOUNT */}
      <p style={sectionLabel}>Account</p>
      <div style={{ ...card, marginBottom: 28 }}>
        <div style={iconBox('#F3E8FF')}>✉️</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 16, color: '#27235C', margin: 0, lineHeight: 1.1 }}>
            {user?.email ?? '—'}
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#667085', margin: '6px 0 0 0', lineHeight: 1.35 }}>
            {providerLabel}
          </p>
        </div>
      </div>

      {/* LEGAL */}
      <p style={sectionLabel}>Legal</p>
      <a
        data-testid="privacy-policy-link"
        href={PRIVACY_POLICY_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...card, textDecoration: 'none', marginBottom: 34 }}
      >
        <div style={iconBox('#F3E8FF')}>📄</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 16, color: '#27235C', margin: 0, lineHeight: 1.1 }}>
            Privacy Policy
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#667085', margin: '6px 0 0 0', lineHeight: 1.35 }}>
            Opens in browser
          </p>
        </div>
        <span style={{ fontSize: 22, color: '#6B7280', lineHeight: 1 }}>↗</span>
      </a>

      {/* Sign Out */}
      <button
        data-testid="sign-out-btn"
        onClick={() => setShowSignOutDialog(true)}
        style={{
          display: 'block',
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          fontSize: 17,
          color: '#EF4444',
          textAlign: 'center',
          padding: '10px 0',
          minHeight: 48,
        }}
      >
        Sign Out
      </button>

      {/* Parental Gate */}
      <ParentalGate
        visible={isVisible}
        question={currentQuestion.question}
        onConfirm={handleGateConfirm}
        onDismiss={handleGateDismiss}
        shaking={shaking}
      />

      {/* Sign Out Confirmation Dialog */}
      {showSignOutDialog && (
        <div
          data-testid="sign-out-confirm-dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 502,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 280, width: '100%' }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 16, color: '#1E1B4B', margin: '0 0 20px 0' }}>
              Are you sure you want to sign out?
            </p>
            <button
              data-testid="sign-out-confirm-btn"
              onClick={handleSignOutConfirm}
              style={{
                display: 'block', width: '100%', minHeight: 48,
                background: '#EF4444', color: '#fff', border: 'none',
                borderRadius: 24, fontFamily: "'Nunito', sans-serif",
                fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8,
              }}
            >
              Sign Out
            </button>
            <button
              data-testid="sign-out-cancel-btn"
              onClick={() => setShowSignOutDialog(false)}
              style={{
                display: 'block', width: '100%', minHeight: 48,
                background: 'transparent', color: '#6B7280',
                border: '1px solid #6B7280', borderRadius: 24,
                fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                fontSize: 15, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Version footer */}
      <p
        data-testid="app-version"
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 13,
          color: '#6B7280',
          textAlign: 'center',
          paddingBottom: 12,
          marginTop: 12,
        }}
      >
        Version {APP_VERSION}
      </p>

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
