import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import { useNotifications } from '../hooks/useNotifications'
import { ParentalGate } from '../../parentalGate/components/ParentalGate'
import { useParentalGate } from '../../../shared/hooks/useParentalGate'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
import { useAuthStore } from '../../../shared/store/authStore'

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
  const monthDelta = now.getMonth() - birth.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export function SettingsScreen({ uid, onSignOut }: SettingsScreenProps) {
  const navigate = useNavigate()
  const { notificationsEnabled, setEnabled } = useNotifications(uid)
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const [shaking, setShaking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const activeProfile = useChildProfileStore((s) => s.activeProfile)
  const user = useAuthStore((s) => s.user)

  const childAge = activeProfile ? calcAge(activeProfile.dateOfBirth) : null
  const providerLabel = user?.providerData[0]?.providerId === 'google.com' ? 'Signed in with Google' : 'Signed in with Email'

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
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
    showToast(notificationsEnabled ? 'Notifications turned off' : 'Notifications turned on')
  }

  async function handleSignOutConfirm() {
    setShowSignOutDialog(false)
    await onSignOut()
  }

  return (
    <div data-testid="settings-screen" className="ckd-settings-screen" style={{ padding: '16px 16px 28px' }}>
      <section className="ckd-settings__section">
        <p className="ckd-section-label">Notifications</p>
        <div className="ckd-settings__item">
          <div className="ckd-settings__item-left">
            <div className="ckd-settings__icon">🔔</div>
            <div>
              <p className="ckd-settings__title">New video alerts</p>
              <p className="ckd-settings__sub">Get notified when new content is added</p>
            </div>
          </div>
          <button
            data-testid="notif-toggle"
            role="switch"
            aria-checked={notificationsEnabled}
            className={`ckd-toggle ${notificationsEnabled ? 'ckd-toggle--on' : ''}`}
            onClick={showGate}
          >
            <span className="ckd-toggle-knob" />
          </button>
        </div>
      </section>

      {activeProfile ? (
        <section className="ckd-settings__section">
          <p className="ckd-section-label">Child Profile</p>
          <button
            type="button"
            data-testid="edit-child-details-btn"
            className="ckd-settings__item"
            onClick={() => navigate('/profile/edit', { state: { mode: 'edit', returnTo: 'settings' } })}
            style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: '#fff' }}
          >
            <div className="ckd-settings__item-left">
              <div className="ckd-settings__icon">🧒</div>
              <div>
                <p className="ckd-settings__title">{activeProfile.name}</p>
                <p className="ckd-settings__sub">{childAge !== null ? `Age ${childAge} · Updated today` : 'Updated today'}</p>
              </div>
            </div>
            <span className="ckd-settings__value">Edit</span>
          </button>
        </section>
      ) : null}

      <section className="ckd-settings__section">
        <p className="ckd-section-label">Account</p>
        <div className="ckd-settings__item">
          <div className="ckd-settings__item-left">
            <div className="ckd-settings__icon">📧</div>
            <div>
              <p className="ckd-settings__title">{user?.email ?? '—'}</p>
              <p className="ckd-settings__sub">{providerLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ckd-settings__section">
        <p className="ckd-section-label">Legal</p>
        <a data-testid="privacy-policy-link" href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="ckd-settings__item" style={{ textDecoration: 'none', marginBottom: 20 }}>
          <div className="ckd-settings__item-left">
            <div className="ckd-settings__icon">📄</div>
            <div>
              <p className="ckd-settings__title">Privacy Policy</p>
              <p className="ckd-settings__sub">Opens in browser</p>
            </div>
          </div>
          <span style={{ color: '#6B7280', fontSize: 18 }}>↗</span>
        </a>
      </section>

      <button
        data-testid="sign-out-btn"
        onClick={() => setShowSignOutDialog(true)}
        style={{
          width: '100%',
          minHeight: 52,
          borderRadius: 24,
          border: 'none',
          background: 'transparent',
          color: '#EF4444',
          font: "700 16px 'Nunito', sans-serif",
          cursor: 'pointer',
        }}
      >
        Sign Out
      </button>

      <p data-testid="app-version" style={{ marginTop: 12, textAlign: 'center', color: '#6B7280', font: "400 13px 'Nunito', sans-serif" }}>
        Version {APP_VERSION}
      </p>

      <ParentalGate
        visible={isVisible}
        question={currentQuestion.question}
        onConfirm={handleGateConfirm}
        onDismiss={hideGate}
        shaking={shaking}
      />

      {showSignOutDialog ? (
        <div data-testid="sign-out-confirm-dialog" className="ckd-modal-scrim">
          <div className="ckd-modal-card">
            <p style={{ margin: '0 0 20px', color: '#1E1B4B', font: "600 16px 'Nunito', sans-serif" }}>
              Are you sure you want to sign out?
            </p>
            <button data-testid="sign-out-confirm-btn" className="ckd-btn-primary" onClick={handleSignOutConfirm} style={{ width: '100%', marginBottom: 8 }}>
              Sign Out
            </button>
            <button
              data-testid="sign-out-cancel-btn"
              onClick={() => setShowSignOutDialog(false)}
              style={{
                width: '100%',
                minHeight: 52,
                borderRadius: 24,
                border: '1px solid #6B7280',
                background: 'transparent',
                color: '#6B7280',
                font: "600 15px 'Nunito', sans-serif",
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          data-testid="settings-toast"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: 24,
            background: '#22C55E',
            color: '#FFFFFF',
            font: "700 14px 'Nunito', sans-serif",
            zIndex: 500,
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
