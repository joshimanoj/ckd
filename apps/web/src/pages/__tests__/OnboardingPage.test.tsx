import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingPage } from '../OnboardingPage'

// Mock authService
vi.mock('../../features/auth/services/authService', () => ({
  signInWithGoogle: vi.fn(),
}))

// Mock asset import
vi.mock('../../assets/creator-photo.jpg', () => ({ default: '/creator-photo.jpg' }))

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
  })

  it('should render sign in screen, show offline state correctly, and handle auth errors', async () => {
    // Online: normal render
    render(<OnboardingPage />)

    expect(screen.getByTestId('creator-photo')).toBeVisible()
    expect(screen.getByTestId('app-name')).toHaveTextContent('Choti Ki Duniya')
    expect(screen.getByTestId('google-signin-btn')).toBeVisible()
    expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument()

    // Offline: offline screen shown
    const { signInWithGoogle } = await import('../../features/auth/services/authService')

    // Render offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const { unmount } = render(<OnboardingPage />)
    expect(screen.getByTestId('offline-screen')).toBeVisible()
    unmount()

    // Error handling: network failure
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const networkError = Object.assign(new Error('network failure'), { code: 'auth/network-request-failed' })
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(networkError)

    render(<OnboardingPage />)
    fireEvent.click(screen.getAllByTestId('google-signin-btn')[0])

    await waitFor(() => {
      const errors = screen.queryAllByTestId('auth-error')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toHaveTextContent('Sign in failed. Please try again.')
    })

    // Error handling: popup closed by user → no error
    vi.clearAllMocks()
    const cancelError = Object.assign(new Error('popup closed'), { code: 'auth/popup-closed-by-user' })
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(cancelError)

    const allBtns = screen.getAllByTestId('google-signin-btn')
    fireEvent.click(allBtns[allBtns.length - 1])

    await waitFor(() => {
      const errors = screen.queryAllByTestId('auth-error')
      // The first render may still show auth-error from before, check for the newly rendered component
      // We expect the last rendered component to NOT show auth-error after cancel
      expect(errors.length).toBe(1) // only the previous render's error, not a new one
    })
  })
})
