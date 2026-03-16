import { describe, it, expect } from 'vitest'
import { dobFromAgeRange } from '../ageRange'

const now = new Date('2026-03-16T00:00:00Z')

describe('dobFromAgeRange', () => {
  it('under-3 → ~18 months ago', () => {
    const result = dobFromAgeRange('under-3', now)
    const expected = new Date('2024-09-16T00:00:00Z')
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(2 * 24 * 60 * 60 * 1000)
  })

  it('3-4 → ~42 months ago', () => {
    const result = dobFromAgeRange('3-4', now)
    const expected = new Date('2022-09-16T00:00:00Z')
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(2 * 24 * 60 * 60 * 1000)
  })

  it('5-6 → ~66 months ago', () => {
    const result = dobFromAgeRange('5-6', now)
    const expected = new Date('2020-09-16T00:00:00Z')
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(2 * 24 * 60 * 60 * 1000)
  })

  it('uses current date by default', () => {
    const result = dobFromAgeRange('under-3')
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).toBeLessThan(Date.now())
  })

  it('custom now parameter works correctly', () => {
    const customNow = new Date('2025-01-01T00:00:00Z')
    const result = dobFromAgeRange('3-4', customNow)
    const expected = new Date('2021-07-01T00:00:00Z')
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(2 * 24 * 60 * 60 * 1000)
  })
})
