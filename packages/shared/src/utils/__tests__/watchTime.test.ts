import { describe, it, expect } from 'vitest'
import { calcCompletionPercent, formatSeconds } from '../watchTime'

describe('calcCompletionPercent', () => {
  it('calculates 25% for 45 of 180 seconds', () => {
    expect(calcCompletionPercent(45, 180)).toBe(25)
  })

  it('calculates 100% for 180 of 180 seconds', () => {
    expect(calcCompletionPercent(180, 180)).toBe(100)
  })

  it('returns 0 when duration is 0 (no crash)', () => {
    expect(calcCompletionPercent(0, 0)).toBe(0)
  })

  it('returns 0 when duration is 0 and watched > 0 (no crash)', () => {
    expect(calcCompletionPercent(10, 0)).toBe(0)
  })

  it('clamps to 100 when watched exceeds duration', () => {
    expect(calcCompletionPercent(181, 180)).toBe(100)
  })

  it('calculates 50% for 90 of 180 seconds', () => {
    expect(calcCompletionPercent(90, 180)).toBe(50)
  })
})

describe('formatSeconds', () => {
  it('formats 3661s as "1 hr 1 min"', () => {
    expect(formatSeconds(3661)).toBe('1 hr 1 min')
  })

  it('formats 90s as "1 min"', () => {
    expect(formatSeconds(90)).toBe('1 min')
  })

  it('formats 30s as "< 1 min"', () => {
    expect(formatSeconds(30)).toBe('< 1 min')
  })
})
