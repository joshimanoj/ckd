import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env['VITE_USE_EMULATOR'] === 'true') {
  Promise.all([
    import('firebase/auth'),
    import('@ckd/shared/firebase/config'),
    import('./features/auth/services/authService'),
  ]).then(([{ signInWithEmailAndPassword }, { auth }, { signOutUser }]) => {
    const w = window as unknown as Record<string, unknown>
    w['__testSignIn'] = (email: string, password: string) =>
      signInWithEmailAndPassword(auth, email, password)
    w['__signOut'] = signOutUser
    // Test hook: set an artificial delay (ms) on the next video fetch
    w['__testVideoFetchDelayMs'] = 0
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
