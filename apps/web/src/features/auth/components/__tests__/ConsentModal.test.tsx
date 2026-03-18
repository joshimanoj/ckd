import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ConsentModal } from '../ConsentModal'
import { recordConsent } from '../../services/authService'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock authStore
const mockSetRouteTo = vi.fn()
vi.mock('../../../../shared/store/authStore', () => ({
  useAuthStore: () => ({ user: { uid: 'test-uid' }, setRouteTo: mockSetRouteTo }),
}))

// Mock authService — recordConsent as a vi.fn() accessible via import
vi.mock('../../services/authService', () => ({
  recordConsent: vi.fn(),
}))

function renderModal() {
  return render(
    <MemoryRouter>
      <ConsentModal />
    </MemoryRouter>,
  )
}

describe('ConsentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Task 2: structure + content
  it('should render all required elements with correct content', () => {
    renderModal()

    expect(screen.getByTestId('consent-checkbox')).toBeInTheDocument()
    expect(screen.getByTestId('consent-submit-btn')).toHaveTextContent('I Agree & Continue')
    expect(screen.getByTestId('consent-privacy-link')).toHaveTextContent('Privacy Policy')
    expect(screen.getByTestId('consent-title')).toHaveTextContent('Before you start 🔒')
    expect(screen.getByTestId('consent-modal')).toHaveTextContent('Your email address')
    expect(screen.getByTestId('consent-modal')).toHaveTextContent("Child's name & age")
    expect(screen.getByTestId('consent-modal')).toHaveTextContent('Watch time data')
  })

  // Task 3: checkbox state + button gating
  it('should start with checkbox unchecked and button disabled', () => {
    renderModal()
    expect(screen.getByTestId('consent-checkbox')).not.toBeChecked()
    expect(screen.getByTestId('consent-submit-btn')).toBeDisabled()
  })

  it('should enable button when checkbox is checked', () => {
    renderModal()
    fireEvent.click(screen.getByTestId('consent-checkbox'))
    expect(screen.getByTestId('consent-checkbox')).toBeChecked()
    expect(screen.getByTestId('consent-submit-btn')).not.toBeDisabled()
  })

  it('should disable button again when checkbox is unchecked', () => {
    renderModal()
    fireEvent.click(screen.getByTestId('consent-checkbox'))
    fireEvent.click(screen.getByTestId('consent-checkbox'))
    expect(screen.getByTestId('consent-submit-btn')).toBeDisabled()
  })

  // Task 4: submit handler
  it('should call recordConsent with uid and navigate to /profile on success', async () => {
    vi.mocked(recordConsent).mockResolvedValueOnce(undefined)
    renderModal()

    await act(async () => {
      fireEvent.click(screen.getByTestId('consent-checkbox'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('consent-submit-btn'))
    })

    await waitFor(() => {
      expect(recordConsent).toHaveBeenCalledWith('test-uid')
      expect(mockNavigate).toHaveBeenCalledWith('/profile')
    })
  })

  it('should show error toast and not navigate when recordConsent rejects', async () => {
    vi.mocked(recordConsent).mockRejectedValueOnce(new Error('network'))
    renderModal()

    await act(async () => {
      fireEvent.click(screen.getByTestId('consent-checkbox'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('consent-submit-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('consent-error-toast')).toBeInTheDocument()
    })
    expect(screen.getByTestId('consent-error-toast')).toHaveTextContent(
      'Something went wrong. Please try again.',
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should not call recordConsent when button is clicked while checkbox is unchecked', () => {
    renderModal()
    fireEvent.click(screen.getByTestId('consent-submit-btn'))
    expect(recordConsent).not.toHaveBeenCalled()
  })

  it('should not dismiss or navigate when overlay backdrop is clicked', () => {
    renderModal()
    fireEvent.click(screen.getByTestId('consent-modal'))
    expect(screen.getByTestId('consent-modal')).toBeInTheDocument()
    expect(recordConsent).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
