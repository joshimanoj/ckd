import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockSetEnabled = vi.fn().mockResolvedValue(undefined)
let mockNotificationsEnabled = false

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    notificationsEnabled: mockNotificationsEnabled,
    setEnabled: mockSetEnabled,
  })),
}))

vi.mock('../../../../shared/store/childProfileStore', () => ({
  useChildProfileStore: vi.fn((selector: (s: { activeProfile: { name: string; dateOfBirth: { toDate: () => Date } } | null }) => unknown) =>
    selector({
      activeProfile: {
        name: 'Arjun',
        dateOfBirth: { toDate: () => new Date('2022-09-16T00:00:00Z') },
      },
    }),
  ),
}))

vi.mock('../../../../shared/store/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { user: null }) => unknown) =>
    selector({ user: null }),
  ),
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
      <div data-testid="parental-gate">
        <button data-testid="gate-submit-btn" onClick={() => onConfirm('5')}>
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

  it('navigates to child profile edit flow when Edit is tapped', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    fireEvent.click(screen.getByTestId('edit-child-details-btn'))
    expect(mockNavigate).toHaveBeenCalledWith('/profile/edit', { state: { mode: 'edit', returnTo: 'settings' } })
  })

  it('should render notification toggle matching notificationsEnabled state', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const toggle = screen.getByTestId('notif-toggle')
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('should render toggle as checked when notificationsEnabled is true', () => {
    mockNotificationsEnabled = true
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const toggle = screen.getByTestId('notif-toggle')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('should open Parental Gate when toggle is tapped', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const toggle = screen.getByTestId('notif-toggle')
    fireEvent.click(toggle)
    expect(mockShowGate).toHaveBeenCalledOnce()
  })

  it('should NOT change toggle state if gate is dismissed', () => {
    mockGateVisible = true
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const dismissBtn = screen.getByTestId('gate-dismiss-btn')
    fireEvent.click(dismissBtn)
    expect(mockSetEnabled).not.toHaveBeenCalled()
  })

  it('should call setEnabled(true) when gate passes and notificationsEnabled is false', async () => {
    mockCheckAnswer.mockReturnValue(true)
    mockGateVisible = true
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const confirmBtn = screen.getByTestId('gate-submit-btn')
    await act(async () => {
      fireEvent.click(confirmBtn)
    })
    await waitFor(() => expect(mockSetEnabled).toHaveBeenCalledWith(true))
  })

  it('should call setEnabled(false) when gate passes and notificationsEnabled is true', async () => {
    mockNotificationsEnabled = true
    mockCheckAnswer.mockReturnValue(true)
    mockGateVisible = true
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const confirmBtn = screen.getByTestId('gate-submit-btn')
    await act(async () => {
      fireEvent.click(confirmBtn)
    })
    await waitFor(() => expect(mockSetEnabled).toHaveBeenCalledWith(false))
  })

  it('Privacy Policy link should be present', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    expect(screen.getByTestId('privacy-policy-link')).toBeInTheDocument()
  })

  it('should render notification toggle label "New video alerts"', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    expect(screen.getByText('New video alerts')).toBeInTheDocument()
  })

  it('should render notification subtitle "Get notified when new content is added"', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    expect(screen.getByText('Get notified when new content is added')).toBeInTheDocument()
  })

  it('Privacy Policy link should NOT be aria-disabled', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const link = screen.getByTestId('privacy-policy-link')
    expect(link).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('Privacy Policy link should open in new tab', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const link = screen.getByTestId('privacy-policy-link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should render Sign Out button', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    expect(screen.getByTestId('sign-out-btn')).toBeInTheDocument()
  })

  it('should show confirmation dialog when Sign Out is tapped', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    fireEvent.click(screen.getByTestId('sign-out-btn'))
    expect(screen.getByTestId('sign-out-confirm-dialog')).toBeVisible()
  })

  it('should hide dialog and NOT call onSignOut when Cancel is tapped', () => {
    const mockSignOut = vi.fn()
    render(<SettingsScreen uid="uid-1" onSignOut={mockSignOut} />)
    fireEvent.click(screen.getByTestId('sign-out-btn'))
    fireEvent.click(screen.getByTestId('sign-out-cancel-btn'))
    expect(screen.queryByTestId('sign-out-confirm-dialog')).not.toBeInTheDocument()
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('should call onSignOut when confirm button is tapped', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined)
    render(<SettingsScreen uid="uid-1" onSignOut={mockSignOut} />)
    fireEvent.click(screen.getByTestId('sign-out-btn'))
    await act(async () => {
      fireEvent.click(screen.getByTestId('sign-out-confirm-btn'))
    })
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('should render app version footer', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    expect(screen.getByTestId('app-version')).toBeInTheDocument()
    expect(screen.getByTestId('app-version').textContent).toMatch(/Version \d+\.\d+\.\d+/)
  })

  it('should not render app-version as a button or link', () => {
    render(<SettingsScreen uid="uid-1" onSignOut={() => Promise.resolve()} />)
    const el = screen.getByTestId('app-version')
    expect(el.tagName.toLowerCase()).not.toBe('button')
    expect(el.tagName.toLowerCase()).not.toBe('a')
  })
})
