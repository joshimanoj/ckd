import { createBrowserRouter } from 'react-router-dom'
import { OnboardingPage } from './pages/OnboardingPage'
import { ChildProfilePage } from './pages/ChildProfilePage'
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
        <ChildProfilePage />
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
