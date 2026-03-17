import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { fetchSessionsSince } from '../dashboardService'

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
  }
})

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))

import { getDocs } from 'firebase/firestore'
const mockGetDocs = vi.mocked(getDocs)

const fakeSession = (watchedSeconds: number, startTime: Date) => ({
  id: `sess-${watchedSeconds}`,
  data: () => ({
    sessionId: `sess-${watchedSeconds}`,
    youtubeVideoId: 'dQw4w9WgXcQ',
    videoDurationSeconds: 180,
    watchedSeconds,
    completionPercent: 50,
    startTime: Timestamp.fromDate(startTime),
    endTime: null,
    deviceType: 'web' as const,
    createdAt: Timestamp.fromDate(startTime),
  }),
})

describe('fetchSessionsSince', () => {
  const db = {} as never
  const since = new Date('2026-03-17T00:00:00')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns array of WatchSession objects from Firestore', async () => {
    const now = new Date()
    mockGetDocs.mockResolvedValueOnce({
      docs: [fakeSession(1800, now), fakeSession(900, now)],
    } as never)

    const result = await fetchSessionsSince(db, 'user-1', 'child-1', since)
    expect(result).toHaveLength(2)
    expect(result[0].watchedSeconds).toBe(1800)
    expect(result[1].watchedSeconds).toBe(900)
  })

  it('returns empty array when no sessions match', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] } as never)
    const result = await fetchSessionsSince(db, 'user-1', 'child-1', since)
    expect(result).toEqual([])
  })

  it('propagates Firestore errors', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('network error'))
    await expect(fetchSessionsSince(db, 'user-1', 'child-1', since)).rejects.toThrow(
      'network error',
    )
  })
})
