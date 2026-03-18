import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingPage } from '../OnboardingPage'

vi.mock('../../features/auth/services/authService', () => ({
  signInWithGoogle: vi.fn(),
}))

vi.mock('../../assets/creator-photo.jpg', () => ({ default: '/creator-photo.jpg' }))

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
  })

  it('shows the splash screen, onboarding slides, and sign-in screen', async () => {
    render(<OnboardingPage />)

    expect(screen.getByTestId('splash-screen')).toBeVisible()
    expect(screen.getByTestId('sign-in-screen')).toHaveAttribute('data-onboarding-step', 'splash')

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByTestId('onboarding-slide-1')).toBeVisible()
    expect(screen.getByRole('heading', { name: /Safe\. Ad-Free\.\s*Just for Your Child\./ })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Next →' }))
    expect(screen.getByTestId('onboarding-slide-2')).toBeVisible()
    expect(screen.getByRole('heading', { name: /Exclusive Videos,\s*Only on the App\./ })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Next →' }))
    expect(screen.getByTestId('onboarding-slide-3')).toBeVisible()
    expect(screen.getByRole('heading', { name: /Trusted by\s*7 Lakh\+ Families\. ❤️/ })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Get Started 🚀' }))

    expect(screen.getByTestId('sign-in-step')).toBeVisible()
    expect(screen.getByTestId('creator-photo')).toBeVisible()
    expect(screen.getByTestId('app-name')).toHaveTextContent(/Choti Ki\s*Duniya/)
    expect(screen.getByTestId('google-signin-btn')).toBeVisible()
    expect(screen.queryByPlaceholderText("Parent's email address")).not.toBeInTheDocument()
    expect(screen.getByText('Khelo Aur Seekho ✨')).toBeVisible()
    expect(screen.getByTestId('sign-in-screen')).toHaveAttribute('data-onboarding-step', 'sign-in')
  })

  it('shows the offline screen when the device is offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })

    render(<OnboardingPage />)

    expect(screen.getByTestId('offline-screen')).toBeVisible()
    expect(screen.getByText('Check your connection')).toBeVisible()
    expect(screen.queryByTestId('sign-in-screen')).not.toBeInTheDocument()
  })

  it('handles auth errors on the sign-in step', async () => {
    const { signInWithGoogle } = await import('../../features/auth/services/authService')
    const networkError = Object.assign(new Error('network failure'), { code: 'auth/network-request-failed' })
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(networkError)

    render(<OnboardingPage />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await act(async () => {
      fireEvent.click(screen.getByTestId('google-signin-btn'))
    })

    expect(screen.getByTestId('auth-error')).toHaveTextContent('Sign in failed. Please try again.')
  })

  it('does not show an error when the Google popup is closed by the user', async () => {
    const { signInWithGoogle } = await import('../../features/auth/services/authService')
    const cancelError = Object.assign(new Error('popup closed'), { code: 'auth/popup-closed-by-user' })
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(cancelError)

    render(<OnboardingPage />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await act(async () => {
      fireEvent.click(screen.getByTestId('google-signin-btn'))
    })

    expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument()
  })
})
