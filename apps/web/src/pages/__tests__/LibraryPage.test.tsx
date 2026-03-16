import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LibraryPage } from '../LibraryPage'

const mockShowGate = vi.fn()
const mockHideGate = vi.fn()
const mockCheckAnswer = vi.fn()

const defaultHookReturn = {
  isVisible: false,
  currentQuestion: { question: '3 + 5 = ?', answer: 8 },
  showGate: mockShowGate,
  hideGate: mockHideGate,
  checkAnswer: mockCheckAnswer,
}

vi.mock('../../shared/hooks/useParentalGate', () => ({
  useParentalGate: vi.fn(() => defaultHookReturn),
}))

import { useParentalGate } from '../../shared/hooks/useParentalGate'
const mockUseParentalGate = vi.mocked(useParentalGate)

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParentalGate.mockReturnValue(defaultHookReturn)
  })

  it('renders library-screen, top-nav, parent-icon-btn, video-grid-placeholder', () => {
    render(<LibraryPage />)
    expect(screen.getByTestId('library-screen')).toBeInTheDocument()
    expect(screen.getByTestId('top-nav')).toBeInTheDocument()
    expect(screen.getByTestId('parent-icon-btn')).toBeInTheDocument()
    expect(screen.getByTestId('video-grid-placeholder')).toBeInTheDocument()
  })

  it('parent-panel is NOT visible initially', () => {
    render(<LibraryPage />)
    expect(screen.queryByTestId('parent-panel')).not.toBeInTheDocument()
  })

  it('clicking parent-icon-btn calls showGate', () => {
    render(<LibraryPage />)
    fireEvent.click(screen.getByTestId('parent-icon-btn'))
    expect(mockShowGate).toHaveBeenCalledTimes(1)
  })

  it('gate modal appears when isVisible=true', () => {
    mockUseParentalGate.mockReturnValue({ ...defaultHookReturn, isVisible: true })
    render(<LibraryPage />)
    expect(screen.getByTestId('parental-gate-modal')).toBeInTheDocument()
  })

  it('correct answer: parent-panel visible, gate dismissed', () => {
    mockCheckAnswer.mockReturnValue(true)
    mockUseParentalGate.mockReturnValue({ ...defaultHookReturn, isVisible: true })
    render(<LibraryPage />)
    fireEvent.change(screen.getByTestId('gate-answer-input'), { target: { value: '8' } })
    fireEvent.click(screen.getByTestId('gate-confirm-btn'))
    expect(mockCheckAnswer).toHaveBeenCalledWith('8')
    expect(mockHideGate).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('parent-panel')).toBeInTheDocument()
  })

  it('dismissing gate: parent-panel stays hidden', () => {
    mockUseParentalGate.mockReturnValue({ ...defaultHookReturn, isVisible: true })
    render(<LibraryPage />)
    fireEvent.click(screen.getByTestId('gate-dismiss-btn'))
    expect(mockHideGate).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('parent-panel')).not.toBeInTheDocument()
  })
})
