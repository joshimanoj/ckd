import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GoogleSignInButton } from '../GoogleSignInButton'

describe('GoogleSignInButton', () => {
  it('should render button, call onSignIn on click, disable during loading, show error text', async () => {
    // Render: button visible with label
    const onSignIn = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)))
    render(<GoogleSignInButton onSignIn={onSignIn} />)

    const btn = screen.getByTestId('google-signin-btn')
    expect(btn).toBeVisible()
    expect(btn).toHaveTextContent('Continue with Google')
    expect(btn).not.toBeDisabled()

    // Click: calls onSignIn
    fireEvent.click(btn)
    expect(onSignIn).toHaveBeenCalledTimes(1)

    // Loading: button is disabled while onSignIn is pending
    expect(btn).toBeDisabled()

    await waitFor(() => expect(btn).not.toBeDisabled())

    // Error: shows auth-error when error prop is set
    const { rerender } = render(<GoogleSignInButton onSignIn={onSignIn} error="Sign in failed. Please try again." />)
    rerender(<GoogleSignInButton onSignIn={vi.fn()} error="Sign in failed. Please try again." />)
    const errorEl = screen.getByTestId('auth-error')
    expect(errorEl).toBeVisible()
    expect(errorEl).toHaveTextContent('Sign in failed. Please try again.')
  })
})
