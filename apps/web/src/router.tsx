import { createBrowserRouter } from 'react-router-dom'
import { OnboardingPage } from './pages/OnboardingPage'
import { AuthGuard } from './shared/components/AuthGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthGuard>
        <OnboardingPage />
      </AuthGuard>
    ),
  },
  {
    path: '/consent',
    element: (
      <AuthGuard>
        <div data-testid="consent-modal">Consent (Story 2)</div>
      </AuthGuard>
    ),
  },
  {
    path: '/profile',
    element: (
      <AuthGuard>
        <div data-testid="profile-screen">Child Profile (Story 3)</div>
      </AuthGuard>
    ),
  },
  {
    path: '/library',
    element: (
      <AuthGuard>
        <div data-testid="library-screen">Library (Story 5)</div>
      </AuthGuard>
    ),
  },
])
