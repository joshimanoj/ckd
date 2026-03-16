import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../shared/store/authStore'
import { recordConsent } from '../services/authService'

export function ConsentModal() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!user || !checked || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await recordConsent(user.uid)
      navigate('/profile')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div
      data-testid="consent-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        data-testid="consent-card"
        style={{
          background: '#FAFAFA',
          borderRadius: '20px',
          padding: '32px 24px',
          maxWidth: '480px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <h2
          data-testid="consent-title"
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontWeight: 700,
            fontSize: '22px',
            color: '#1E1B4B',
            margin: '0 0 16px',
          }}
        >
          Before we begin
        </h2>

        <div data-testid="consent-body">
          <p
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '15px',
              color: '#1E1B4B',
              lineHeight: 1.5,
              margin: '0 0 8px',
            }}
          >
            We collect:
          </p>
          <ul
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '15px',
              color: '#1E1B4B',
              lineHeight: 1.5,
              paddingLeft: '20px',
              margin: '0 0 16px',
            }}
          >
            <li>Your name and email (from your Google account)</li>
            <li>Your child&apos;s name and date of birth</li>
            <li>How long your child watches each video (watch time data)</li>
            <li>Your device token (to send you notifications, only if you opt in)</li>
          </ul>
          <p
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '15px',
              color: '#1E1B4B',
              lineHeight: 1.5,
              margin: '0 0 24px',
            }}
          >
            <strong>Why:</strong> To personalise your child&apos;s profile, show you watch time,
            and notify you about new videos.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            minHeight: '48px',
            marginBottom: '24px',
          }}
        >
          <input
            type="checkbox"
            id="consent-checkbox"
            data-testid="consent-checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{
              marginTop: '2px',
              width: '20px',
              height: '20px',
              accentColor: '#9333EA',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <label
            htmlFor="consent-checkbox"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '14px',
              color: '#1E1B4B',
              lineHeight: 1.5,
              cursor: 'pointer',
            }}
          >
            I have read and agree to the{' '}
            <a
              href="#"
              data-testid="consent-privacy-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9333EA', textDecoration: 'underline' }}
            >
              Privacy Policy
            </a>{' '}
            and consent to the collection of my child&apos;s usage data as described above.
          </label>
        </div>

        <button
          data-testid="consent-submit-btn"
          disabled={!checked || submitting}
          onClick={handleSubmit}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '24px',
            border: 'none',
            backgroundColor: checked && !submitting ? '#F43F5E' : '#D1D5DB',
            color: '#fff',
            opacity: checked && !submitting ? 1 : 0.6,
            cursor: checked && !submitting ? 'pointer' : 'not-allowed',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          I Agree &amp; Continue
        </button>

        {error && (
          <div
            data-testid="consent-error-toast"
            role="alert"
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
