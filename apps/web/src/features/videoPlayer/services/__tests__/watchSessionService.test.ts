import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Timestamp } from 'firebase/firestore'

const { mockAddDoc, mockCollection, mockServerTimestamp } = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockServerTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
}))

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    addDoc: mockAddDoc,
    collection: mockCollection,
    serverTimestamp: mockServerTimestamp,
  }
})

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))

describe('watchSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCollection.mockReturnValue({ path: 'watchSessions' })
    mockAddDoc.mockResolvedValue({ id: 'new-session-id' })
  })

  it('writes a document with correct fields and returns the doc id', async () => {
    const { writeWatchSession } = await import('../watchSessionService')
    const payload = {
      youtubeVideoId: 'abc',
      videoDurationSeconds: 180,
      watchedSeconds: 45,
      completionPercent: 25,
      startTime: Timestamp.now(),
      endTime: null,
      deviceType: 'web' as const,
    }

    const docId = await writeWatchSession('user-1', 'child-1', payload)

    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    const writtenData = mockAddDoc.mock.calls[0][1]
    expect(writtenData.youtubeVideoId).toBe('abc')
    expect(writtenData.watchedSeconds).toBe(45)
    expect(writtenData.deviceType).toBe('web')
    expect(writtenData.endTime).not.toBeNull()
    expect(writtenData.createdAt).toBeDefined()
    expect(docId).toBe('new-session-id')
  })

  it('uses calcCompletionPercent — completionPercent 25 for 45/180', async () => {
    const { writeWatchSession } = await import('../watchSessionService')
    const payload = {
      youtubeVideoId: 'abc',
      videoDurationSeconds: 180,
      watchedSeconds: 45,
      completionPercent: 0, // will be recalculated
      startTime: Timestamp.now(),
      endTime: null,
      deviceType: 'web' as const,
    }

    await writeWatchSession('user-1', 'child-1', payload)

    const writtenData = mockAddDoc.mock.calls[0][1]
    expect(writtenData.completionPercent).toBe(25)
  })
})
