import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockOptIn = vi.fn().mockResolvedValue(undefined)
const mockOptOut = vi.fn().mockResolvedValue(undefined)
let mockNotificationsEnabled = false

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    notificationsEnabled: mockNotificationsEnabled,
    optIn: mockOptIn,
    optOut: mockOptOut,
  })),
}))

const mockShowGate = vi.fn()
const mockHideGate = vi.fn()
const mockCheckAnswer = vi.fn()
let mockGateVisible = false

vi.mock('../../../../shared/hooks/useParentalGate', () => ({
  useParentalGate: vi.fn(() => ({
    isVisible: mockGateVisible,
    currentQuestion: { question: '2 + 3', answer: 5 },
    showGate: mockShowGate,
    hideGate: mockHideGate,
    checkAnswer: mockCheckAnswer,
  })),
}))

vi.mock('../../../../features/parentalGate/components/ParentalGate', () => ({
  ParentalGate: ({
    visible,
    onConfirm,
    onDismiss,
  }: {
    visible: boolean
    onConfirm: (a: string) => void
    onDismiss: () => void
  }) =>
    visible ? (
      <div data-testid="parental-gate-modal">
        <button data-testid="gate-confirm-btn" onClick={() => onConfirm('5')}>
          Confirm
        </button>
        <button data-testid="gate-dismiss-btn" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    ) : null,
}))

import { SettingsScreen } from '../SettingsScreen'

// ── Tests ──────────────────────────────────────────────────────────────────
describe('SettingsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotificationsEnabled = false
    mockGateVisible = false
    mockCheckAnswer.mockReturnValue(false)
  })

  it('should render notification toggle matching notificationsEnabled state', () => {
    render(<SettingsScreen uid="uid-1" />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeInTheDocument()
    expect((toggle as HTMLInputElement).checked).toBe(false)
  })

  it('should render toggle as checked when notificationsEnabled is true', () => {
    mockNotificationsEnabled = true
    render(<SettingsScreen uid="uid-1" />)
    const toggle = screen.getByRole('switch')
    expect((toggle as HTMLInputElement).checked).toBe(true)
  })

  it('should open Parental Gate when toggle is tapped', () => {
    render(<SettingsScreen uid="uid-1" />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(mockShowGate).toHaveBeenCalledOnce()
  })

  it('should NOT change toggle state if gate is dismissed', () => {
    mockGateVisible = true
    render(<SettingsScreen uid="uid-1" />)
    const dismissBtn = screen.getByTestId('gate-dismiss-btn')
    fireEvent.click(dismissBtn)
    expect(mockOptIn).not.toHaveBeenCalled()
    expect(mockOptOut).not.toHaveBeenCalled()
  })

  it('should call optIn() when gate passes and notificationsEnabled is false', async () => {
    mockCheckAnswer.mockReturnValue(true)
    mockGateVisible = true
    render(<SettingsScreen uid="uid-1" />)
    const confirmBtn = screen.getByTestId('gate-confirm-btn')
    await act(async () => {
      fireEvent.click(confirmBtn)
    })
    await waitFor(() => expect(mockOptIn).toHaveBeenCalledOnce())
  })

  it('should call optOut() when gate passes and notificationsEnabled is true', async () => {
    mockNotificationsEnabled = true
    mockCheckAnswer.mockReturnValue(true)
    mockGateVisible = true
    render(<SettingsScreen uid="uid-1" />)
    const confirmBtn = screen.getByTestId('gate-confirm-btn')
    await act(async () => {
      fireEvent.click(confirmBtn)
    })
    await waitFor(() => expect(mockOptOut).toHaveBeenCalledOnce())
  })

  it('Privacy Policy link should be present', () => {
    render(<SettingsScreen uid="uid-1" />)
    expect(screen.getByTestId('privacy-policy-link')).toBeInTheDocument()
  })
})
