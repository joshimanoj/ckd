import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'

vi.mock('../../services/dashboardService', () => ({
  fetchSessionsSince: vi.fn(),
}))

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))

import { fetchSessionsSince } from '../../services/dashboardService'
import { useDashboard } from '../useDashboard'

const mockFetch = vi.mocked(fetchSessionsSince)

function makeSession(watchedSeconds: number, startIso: string) {
  return {
    sessionId: `s-${watchedSeconds}`,
    youtubeVideoId: 'vid',
    videoDurationSeconds: 180,
    watchedSeconds,
    completionPercent: 50,
    startTime: Timestamp.fromDate(new Date(startIso)),
    endTime: null,
    deviceType: 'web' as const,
    createdAt: Timestamp.fromDate(new Date(startIso)),
  }
}

describe('useDashboard', () => {
  const db = {} as never

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading=true initially', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useDashboard(db, 'u1', 'c1'))
    expect(result.current.loading).toBe(true)
  })

  it('aggregates todaySeconds from today sessions', async () => {
    const today = new Date()
    today.setHours(10, 0, 0, 0)
    const sessions = [makeSession(1800, today.toISOString()), makeSession(900, today.toISOString())]
    // today, week, month all return sessions
    mockFetch.mockResolvedValue(sessions)

    const { result } = renderHook(() => useDashboard(db, 'u1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.todaySeconds).toBe(2700)
  })

  it('returns loading=false and data after fetch resolves', async () => {
    mockFetch.mockResolvedValue([])
    const { result } = renderHook(() => useDashboard(db, 'u1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.todaySeconds).toBe(0)
    expect(result.current.weekDayTotals).toHaveLength(7)
    expect(result.current.monthSeconds).toBe(0)
  })

  it('sets error when fetchSessionsSince throws', async () => {
    mockFetch.mockRejectedValue(new Error('network fail'))
    const { result } = renderHook(() => useDashboard(db, 'u1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('network fail')
  })

  it('does not fire queries when uid is empty', async () => {
    renderHook(() => useDashboard(db, '', 'c1'))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not fire queries when childProfileId is empty', async () => {
    renderHook(() => useDashboard(db, 'u1', ''))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('buckets sessions into correct weekday slots (Mon=0)', async () => {
    // 2026-03-16 is a Monday — day index 0
    const monday = new Date('2026-03-16T10:00:00')
    // 2026-03-18 is Wednesday — day index 2
    const wednesday = new Date('2026-03-18T10:00:00')
    const sessions = [makeSession(3600, monday.toISOString()), makeSession(1800, wednesday.toISOString())]
    mockFetch.mockResolvedValue(sessions)

    const { result } = renderHook(() => useDashboard(db, 'u1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.weekDayTotals[0]).toBe(3600) // Mon
    expect(result.current.weekDayTotals[2]).toBe(1800) // Wed
    expect(result.current.weekDayTotals[1]).toBe(0)    // Tue
  })

  it('isEmpty is true when all fetch results are empty', async () => {
    mockFetch.mockResolvedValue([])
    const { result } = renderHook(() => useDashboard(db, 'u1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isEmpty).toBe(true)
  })

  it('isEmpty is false when any sessions exist', async () => {
    const today = new Date()
    today.setHours(10, 0, 0, 0)
    mockFetch.mockResolvedValue([makeSession(300, today.toISOString())])
    const { result } = renderHook(() => useDashboard(db, 'u1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isEmpty).toBe(false)
  })
})
