import { createBrowserRouter } from 'react-router-dom'
import { OnboardingPage } from './pages/OnboardingPage'
import { AuthGuard } from './shared/components/AuthGuard'
import { ConsentModal } from './features/auth/components/ConsentModal'

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
        <ConsentModal />
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
