import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useParentalGate } from '../useParentalGate'

vi.mock('@ckd/shared/utils/parentalGate', () => ({
  generateGateQuestion: vi
    .fn()
    .mockReturnValue({ question: '3 + 5 = ?', answer: 8 }),
}))

import { generateGateQuestion } from '@ckd/shared/utils/parentalGate'
const mockGenerate = vi.mocked(generateGateQuestion)

describe('useParentalGate', () => {
  beforeEach(() => {
    mockGenerate.mockReturnValue({ question: '3 + 5 = ?', answer: 8 })
    vi.clearAllMocks()
    mockGenerate.mockReturnValue({ question: '3 + 5 = ?', answer: 8 })
  })

  it('initial state: isVisible=false, currentQuestion is valid', () => {
    const { result } = renderHook(() => useParentalGate())
    expect(result.current.isVisible).toBe(false)
    expect(result.current.currentQuestion).toBeDefined()
    expect(result.current.currentQuestion.question).toMatch(/\d+/)
    expect(typeof result.current.currentQuestion.answer).toBe('number')
  })

  it('showGate sets isVisible=true', () => {
    const { result } = renderHook(() => useParentalGate())
    act(() => { result.current.showGate() })
    expect(result.current.isVisible).toBe(true)
  })

  it('hideGate sets isVisible=false', () => {
    const { result } = renderHook(() => useParentalGate())
    act(() => { result.current.showGate() })
    act(() => { result.current.hideGate() })
    expect(result.current.isVisible).toBe(false)
  })

  it('checkAnswer with correct answer returns true', () => {
    const { result } = renderHook(() => useParentalGate())
    let correct: boolean
    act(() => {
      correct = result.current.checkAnswer('8')
    })
    expect(correct!).toBe(true)
  })

  it('checkAnswer with wrong answer returns false and changes question', () => {
    mockGenerate
      .mockReturnValueOnce({ question: '3 + 5 = ?', answer: 8 }) // initial
      .mockReturnValueOnce({ question: '2 + 4 = ?', answer: 6 }) // after wrong
    const { result } = renderHook(() => useParentalGate())
    let wrong: boolean
    act(() => {
      wrong = result.current.checkAnswer('99')
    })
    expect(wrong!).toBe(false)
    expect(result.current.currentQuestion.question).toBe('2 + 4 = ?')
  })

  it('new question after wrong answer differs from old one (no consecutive repeat)', () => {
    mockGenerate
      .mockReturnValueOnce({ question: '3 + 5 = ?', answer: 8 })
      .mockReturnValueOnce({ question: '3 + 5 = ?', answer: 8 }) // same — retry
      .mockReturnValueOnce({ question: '1 + 2 = ?', answer: 3 }) // different
    const { result } = renderHook(() => useParentalGate())
    act(() => {
      result.current.checkAnswer('99')
    })
    expect(result.current.currentQuestion.question).toBe('1 + 2 = ?')
  })

  it('checkAnswer with empty string returns false without throwing', () => {
    const { result } = renderHook(() => useParentalGate())
    let res: boolean
    expect(() => {
      act(() => { res = result.current.checkAnswer('') })
    }).not.toThrow()
    expect(res!).toBe(false)
  })

  it('checkAnswer with non-numeric string returns false without throwing', () => {
    const { result } = renderHook(() => useParentalGate())
    let res: boolean
    expect(() => {
      act(() => { res = result.current.checkAnswer('abc') })
    }).not.toThrow()
    expect(res!).toBe(false)
  })
})
