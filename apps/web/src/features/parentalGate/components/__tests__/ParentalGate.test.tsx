import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParentalGate } from '../ParentalGate'

const defaultProps = {
  visible: true,
  question: '3 + 5 = ?',
  onConfirm: vi.fn(),
  onDismiss: vi.fn(),
  shaking: false,
}

describe('ParentalGate', () => {
  it('renders nothing when visible=false', () => {
    const { container } = render(<ParentalGate {...defaultProps} visible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders modal with all children when visible=true', () => {
    render(<ParentalGate {...defaultProps} />)
    expect(screen.getByTestId('parental-gate-modal')).toBeInTheDocument()
    expect(screen.getByTestId('gate-question')).toHaveTextContent('3 + 5 = ?')
    expect(screen.getByTestId('gate-answer-input')).toBeInTheDocument()
    expect(screen.getByTestId('gate-confirm-btn')).toBeInTheDocument()
    expect(screen.getByTestId('gate-dismiss-btn')).toBeInTheDocument()
  })

  it('confirm button disabled when input is empty', () => {
    render(<ParentalGate {...defaultProps} />)
    expect(screen.getByTestId('gate-confirm-btn')).toBeDisabled()
  })

  it('confirm button enabled when input has value', () => {
    render(<ParentalGate {...defaultProps} />)
    fireEvent.change(screen.getByTestId('gate-answer-input'), { target: { value: '8' } })
    expect(screen.getByTestId('gate-confirm-btn')).not.toBeDisabled()
  })

  it('clicking confirm calls onConfirm with the typed value', () => {
    const onConfirm = vi.fn()
    render(<ParentalGate {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.change(screen.getByTestId('gate-answer-input'), { target: { value: '8' } })
    fireEvent.click(screen.getByTestId('gate-confirm-btn'))
    expect(onConfirm).toHaveBeenCalledWith('8')
  })

  it('clicking dismiss calls onDismiss', () => {
    const onDismiss = vi.fn()
    render(<ParentalGate {...defaultProps} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('gate-dismiss-btn'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('clicking scrim does NOT call onDismiss', () => {
    const onDismiss = vi.fn()
    render(<ParentalGate {...defaultProps} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('parental-gate-modal'))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  // Task 4 tests: shake + question change
  it('applies shake animation style when shaking=true', () => {
    render(<ParentalGate {...defaultProps} shaking={true} />)
    const wrapper = screen.getByTestId('gate-input-wrapper')
    expect(wrapper.getAttribute('style')).toContain('gate-shake')
  })

  it('no animation when shaking=false', () => {
    render(<ParentalGate {...defaultProps} shaking={false} />)
    const wrapper = screen.getByTestId('gate-input-wrapper')
    const style = wrapper.getAttribute('style') ?? ''
    expect(style).not.toContain('gate-shake')
  })

  it('input value resets when question prop changes', () => {
    const { rerender } = render(<ParentalGate {...defaultProps} question="3 + 5 = ?" />)
    fireEvent.change(screen.getByTestId('gate-answer-input'), { target: { value: '8' } })
    expect(screen.getByTestId('gate-answer-input')).toHaveValue(8)
    rerender(<ParentalGate {...defaultProps} question="2 + 2 = ?" />)
    expect(screen.getByTestId('gate-answer-input')).toHaveValue(null)
  })
})
