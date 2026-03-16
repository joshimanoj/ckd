import { useState, useEffect } from 'react'
import creatorPhoto from '../assets/creator-photo.jpg'
import { GoogleSignInButton } from '../features/auth/components/GoogleSignInButton'
import { signInWithGoogle } from '../features/auth/services/authService'

export function OnboardingPage() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [authError, setAuthError] = useState<string | undefined>(undefined)

  useEffect(() => {
    function handleOnline() { setIsOffline(false) }
    function handleOffline() { setIsOffline(true) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOffline) {
    return (
      <div data-testid="offline-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', animation: 'fadeIn 200ms ease-in' }}>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '16px', color: '#1E1B4B' }}>Check your connection</p>
        <button
          onClick={() => { if (navigator.onLine) setIsOffline(false) }}
          style={{ padding: '12px 24px', borderRadius: '24px', backgroundColor: '#9333EA', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
        >
          Retry
        </button>
      </div>
    )
  }

  async function handleSignIn() {
    setAuthError(undefined)
    await signInWithGoogle()
  }

  function handleSignInWithError() {
    return handleSignIn().catch((err: { code?: string }) => {
      if (err.code === 'auth/popup-closed-by-user') return
      setAuthError('Sign in failed. Please try again.')
    })
  }

  return (
    <div data-testid="sign-in-screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '100vw', overflow: 'hidden' }}>
      {/* Upper half — gradient */}
      <div style={{ background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)', height: '50vh', position: 'relative', flexShrink: 0 }} />

      {/* Creator photo — straddles gradient / surface boundary */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginTop: '-60px', zIndex: 1 }}>
        <img
          src={creatorPhoto}
          alt="Creator photo"
          data-testid="creator-photo"
          style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid #F59E0B', objectFit: 'cover' }}
        />
      </div>

      {/* Lower half — surface */}
      <div style={{ backgroundColor: '#FAFAFA', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px', paddingBottom: '32px' }}>
        <h1
          data-testid="app-name"
          style={{ fontFamily: '"Baloo 2", cursive', fontWeight: 800, fontSize: '28px', color: '#9333EA', margin: '0 0 24px' }}
        >
          Choti Ki Duniya
        </h1>

        <div style={{ width: '100%', maxWidth: '360px', padding: '0 32px', boxSizing: 'border-box' }}>
          <GoogleSignInButton onSignIn={handleSignInWithError} error={authError} />
        </div>
      </div>
    </div>
  )
}
