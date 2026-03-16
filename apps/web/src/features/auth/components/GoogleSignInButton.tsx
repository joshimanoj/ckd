import { useState } from 'react'

interface GoogleSignInButtonProps {
  onSignIn: () => Promise<void>
  error?: string
}

export function GoogleSignInButton({ onSignIn, error }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    try {
      await onSignIn()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        data-testid="google-signin-btn"
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading}
        style={{
          backgroundColor: '#F43F5E',
          color: '#FFFFFF',
          height: '48px',
          borderRadius: '24px',
          width: '100%',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 600,
          fontSize: '15px',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {isLoading ? (
          <>
            <span
              style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Signing in…
          </>
        ) : (
          <>
            <GoogleGIcon />
            Continue with Google
          </>
        )}
      </button>
      {error && (
        <p
          data-testid="auth-error"
          style={{ color: '#EF4444', fontFamily: 'Nunito, sans-serif', fontSize: '13px', margin: '4px 0 0' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.48A4.8 4.8 0 014.5 7.5V5.43H1.83a8 8 0 000 7.14L4.5 10.48z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.04c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.43L4.5 7.5c.68-2.04 2.56-3.46 4.48-3.46z"
      />
    </svg>
  )
}
