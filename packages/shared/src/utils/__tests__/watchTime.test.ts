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

  it('formats 0s as "< 1 min"', () => {
    expect(formatSeconds(0)).toBe('< 1 min')
  })

  it('formats 60s as "1 min"', () => {
    expect(formatSeconds(60)).toBe('1 min')
  })

  it('formats 2700s as "45 min"', () => {
    expect(formatSeconds(2700)).toBe('45 min')
  })

  it('formats 3600s as "1 hr" (not "1 hr 0 min")', () => {
    expect(formatSeconds(3600)).toBe('1 hr')
  })

  it('formats 3660s as "1 hr 1 min"', () => {
    expect(formatSeconds(3660)).toBe('1 hr 1 min')
  })

  it('formats 7200s as "2 hr" (not "2 hr 0 min")', () => {
    expect(formatSeconds(7200)).toBe('2 hr')
  })

  it('formats 8100s as "2 hr 15 min"', () => {
    expect(formatSeconds(8100)).toBe('2 hr 15 min')
  })
})
