import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../shared/store/authStore'
import { recordConsent } from '../services/authService'

const consentItems = [
  {
    icon: '📧',
    title: 'Your email address',
    description: 'Used only to identify your account. Never shared.',
  },
  {
    icon: '👶',
    title: "Child's name & age",
    description: 'Used to personalise and track watch time for your child.',
  },
  {
    icon: '⏱️',
    title: 'Watch time data',
    description: 'Which videos were watched and for how long. Powers your dashboard.',
  },
  {
    icon: '🔔',
    title: 'Push notifications',
    description: 'Only if you opt in. For new video alerts. Always optional.',
  },
]

function BlobBackground() {
  return (
    <div className="ckd-blob-bg" aria-hidden="true">
      <span className="ckd-blob ckd-blob--one" />
      <span className="ckd-blob ckd-blob--two" />
      <span className="ckd-blob ckd-blob--three" />
    </div>
  )
}

export function ConsentModal() {
  const { user, setRouteTo } = useAuthStore()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.history.pushState(null, '', '/consent')
    const handlePopState = () => {
      navigate('/consent', { replace: true })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  async function handleSubmit() {
    if (!user || !checked || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await recordConsent(user.uid)
      setRouteTo('profile')
      navigate('/profile')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div data-testid="consent-modal" className="ckd-consent">
      <header className="ckd-consent__header">
        <BlobBackground />
        <h2 data-testid="consent-title" className="ckd-consent__title">
          Before you start 🔒
        </h2>
        <p className="ckd-consent__sub">We collect minimal data to power the experience</p>
      </header>

      <div data-testid="consent-card" className="ckd-consent__body">
        {consentItems.map((item) => (
          <div className="ckd-consent__item" key={item.title}>
            <div className="ckd-consent__icon" aria-hidden="true">
              {item.icon}
            </div>
            <div>
              <p className="ckd-consent__item-title">{item.title}</p>
              <p className="ckd-consent__item-desc">{item.description}</p>
            </div>
          </div>
        ))}

        <label className="ckd-consent__checkbox" htmlFor="consent-checkbox">
          <input
            id="consent-checkbox"
            data-testid="consent-checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            type="checkbox"
            style={{ display: 'none' }}
          />
          <span
            className={`ckd-consent__checkbox-box${checked ? ' ckd-consent__checkbox-box--checked' : ''}`}
            aria-hidden="true"
          >
            {checked ? '✓' : ''}
          </span>
          <span className="ckd-consent__checkbox-label">
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
          </span>
        </label>

        <button
          data-testid="consent-submit-btn"
          disabled={!checked || submitting}
          onClick={handleSubmit}
          className="ckd-primary-btn"
          style={{ width: '100%' }}
        >
          I Agree &amp; Continue →
        </button>

        {error ? (
          <div data-testid="consent-error-toast" role="alert" className="ckd-error-toast">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  )
}
