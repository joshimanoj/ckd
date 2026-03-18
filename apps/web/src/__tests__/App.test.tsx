import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock useAuth hook
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock OnboardingPage
vi.mock('../pages/OnboardingPage', () => ({
  OnboardingPage: () => <div data-testid="sign-in-screen">Sign In</div>,
}))

// Mock firebase config (prevents real Firebase init)
vi.mock('@ckd/shared/firebase/config', () => ({ auth: {}, db: {} }))
vi.mock('@ckd/shared/firebase/collections', () => ({ userDoc: vi.fn(), usersCollection: vi.fn() }))

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should route correctly based on auth state and routeTo value', async () => {
    const { useAuth } = await import('../features/auth/hooks/useAuth')
    const { default: App } = await import('../App')

    // Unauthenticated: shows OnboardingPage (sign-in-screen)
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, routeTo: 'sign-in', signOut: vi.fn() })
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument())
  })

  it('should show LoadingSpinner while loading is true', async () => {
    const { useAuth } = await import('../features/auth/hooks/useAuth')
    const { default: App } = await import('../App')

    vi.mocked(useAuth).mockReturnValue({ user: null, loading: true, routeTo: 'sign-in', signOut: vi.fn() })
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('loading-spinner')).toBeInTheDocument())
  })

  it('should route to consent when routeTo is consent', async () => {
    const { useAuth } = await import('../features/auth/hooks/useAuth')
    const { default: App } = await import('../App')

    vi.mocked(useAuth).mockReturnValue({ user: { uid: 'u1' } as Parameters<ReturnType<typeof useAuth>['user'] & object extends never ? never : object>['uid'] extends string ? import('firebase/auth').User : never, loading: false, routeTo: 'consent', signOut: vi.fn() })
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('consent-modal')).toBeInTheDocument())
  })

  it('should route to library when routeTo is library', async () => {
    const { useAuth } = await import('../features/auth/hooks/useAuth')
    const { default: App } = await import('../App')

    vi.mocked(useAuth).mockReturnValue({ user: { uid: 'u1' } as import('firebase/auth').User, loading: false, routeTo: 'library', signOut: vi.fn() })
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('library-screen')).toBeInTheDocument())
  })
})
