import { describe, it, expect } from 'vitest'
import { parseDuration } from '../duration'

describe('parseDuration', () => {
  it('parses standard mm:ss', () => {
    expect(parseDuration('3:45')).toBe(225)
  })

  it('parses zero seconds', () => {
    expect(parseDuration('0:00')).toBe(0)
  })

  it('parses durations over 60 minutes', () => {
    expect(parseDuration('90:00')).toBe(5400)
  })

  it('returns null for bad format', () => {
    expect(parseDuration('badformat')).toBeNull()
    expect(parseDuration('345')).toBeNull()
    expect(parseDuration('3:60')).toBeNull()
    expect(parseDuration('')).toBeNull()
  })

  it('trims whitespace', () => {
    expect(parseDuration(' 2:30 ')).toBe(150)
  })
})
