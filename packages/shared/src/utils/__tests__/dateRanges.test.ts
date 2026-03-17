import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { startOfToday, startOfWeek, startOfMonth } from '../dateRanges'

describe('startOfToday', () => {
  it('returns today at midnight local time', () => {
    const result = startOfToday()
    const now = new Date()
    expect(result.getFullYear()).toBe(now.getFullYear())
    expect(result.getMonth()).toBe(now.getMonth())
    expect(result.getDate()).toBe(now.getDate())
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })
})

describe('startOfWeek', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns Monday at midnight when today is Wednesday', () => {
    // 2026-03-18 is a Wednesday
    vi.setSystemTime(new Date('2026-03-18T14:30:00'))
    const result = startOfWeek()
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2) // March = 2
    expect(result.getDate()).toBe(16) // Monday 2026-03-16
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })

  it('returns today at midnight when today is Monday', () => {
    // 2026-03-16 is a Monday
    vi.setSystemTime(new Date('2026-03-16T09:00:00'))
    const result = startOfWeek()
    expect(result.getDate()).toBe(16)
    expect(result.getHours()).toBe(0)
  })

  it('returns previous Monday when today is Sunday', () => {
    // 2026-03-22 is a Sunday
    vi.setSystemTime(new Date('2026-03-22T10:00:00'))
    const result = startOfWeek()
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(16) // Monday 2026-03-16
  })

  it('returns previous Monday when today is Saturday', () => {
    // 2026-03-21 is a Saturday
    vi.setSystemTime(new Date('2026-03-21T10:00:00'))
    const result = startOfWeek()
    expect(result.getDate()).toBe(16) // Monday 2026-03-16
  })
})

describe('startOfMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 1st of the current month at midnight', () => {
    vi.setSystemTime(new Date('2026-03-17T15:00:00'))
    const result = startOfMonth()
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2) // March
    expect(result.getDate()).toBe(1)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })

  it('returns today when today is the 1st', () => {
    vi.setSystemTime(new Date('2026-03-01T08:00:00'))
    const result = startOfMonth()
    expect(result.getDate()).toBe(1)
    expect(result.getHours()).toBe(0)
  })
})
