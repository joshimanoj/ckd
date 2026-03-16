import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateGateQuestion } from '../parentalGate'

describe('generateGateQuestion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns addition question when Math.random > 0.5', () => {
    // First call (useAdd check) > 0.5 → addition; operand calls return fixed values
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.9) // useAdd → true
      .mockReturnValueOnce(0.2) // a → Math.floor(0.2*9)+1 = 2
      .mockReturnValueOnce(0.6) // b → Math.floor(0.6*9)+1 = 6

    const result = generateGateQuestion()
    expect(result.question).toContain('+')
    expect(result.question).toMatch(/\d+ \+ \d+ = \?/)
    expect(result.answer).toBe(result.answer) // answer is sum of operands
    expect(result.answer).toBeGreaterThanOrEqual(2)
  })

  it('returns subtraction question when Math.random ≤ 0.5', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.3)  // useAdd → false
      .mockReturnValueOnce(0.2)  // a → 2
      .mockReturnValueOnce(0.7)  // b → 7

    const result = generateGateQuestion()
    expect(result.question).toContain('−') // U+2212 minus sign
    expect(result.question).toMatch(/\d+ − \d+ = \?/)
    expect(result.answer).toBeGreaterThanOrEqual(0) // no negative answers
  })

  it('subtraction result is never negative — 100 real calls', () => {
    for (let i = 0; i < 100; i++) {
      const r = generateGateQuestion()
      if (r.question.includes('−')) {
        expect(r.answer).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('all operands are 1–9 and answers in range 0–18 — 100 real calls', () => {
    for (let i = 0; i < 100; i++) {
      const r = generateGateQuestion()
      const match = r.question.match(/(\d+) [+−] (\d+) = \?/)
      expect(match).not.toBeNull()
      const a = parseInt(match![1])
      const b = parseInt(match![2])
      expect(a).toBeGreaterThanOrEqual(1)
      expect(a).toBeLessThanOrEqual(9)
      expect(b).toBeGreaterThanOrEqual(1)
      expect(b).toBeLessThanOrEqual(9)
      expect(r.answer).toBeGreaterThanOrEqual(0)
      expect(r.answer).toBeLessThanOrEqual(18)
    }
  })

  it('uses minus sign U+2212, not hyphen, for subtraction', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.0) // useAdd → false
      .mockReturnValueOnce(0.8) // a → 8
      .mockReturnValueOnce(0.1) // b → 1

    const result = generateGateQuestion()
    expect(result.question).toContain('\u2212') // U+2212 minus sign
    expect(result.question).not.toContain('-') // no hyphen
  })
})
