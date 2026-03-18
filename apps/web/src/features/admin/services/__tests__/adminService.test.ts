import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase modules before importing the service
vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))
vi.mock('@ckd/shared/firebase/collections', () => ({
  videosCollection: vi.fn(() => 'videos-col-ref'),
  notificationsCollection: vi.fn(() => 'notifs-col-ref'),
}))

const mockGetDocs = vi.fn()
const mockAddDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockOnSnapshot = vi.fn()
const mockDoc = vi.fn(() => 'doc-ref')
const mockQuery = vi.fn((ref) => ref)
const mockOrderBy = vi.fn()
const mockServerTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }))

vi.mock('firebase/firestore', () => ({
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  onSnapshot: mockOnSnapshot,
  doc: mockDoc,
  query: mockQuery,
  orderBy: mockOrderBy,
  serverTimestamp: () => mockServerTimestamp(),
}))

import {
  fetchAllVideos,
  addVideo,
  toggleIsActive,
  addNotification,
  subscribeToNotification,
} from '../adminService'
import type { AddVideoInput, AddNotificationInput } from '../adminService'

const makeVideoDoc = (id: string, title: string, isActive: boolean) => ({
  data: () => ({ videoId: id, title, category: 'Rhymes', isActive, order: 1, durationSeconds: 60,
    youtubeVideoId: 'abc', thumbnailUrl: 'https://t.jpg',
    publishedAt: { seconds: 0, nanoseconds: 0 } }),
})

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchAllVideos', () => {
    it('returns mapped video array from Firestore snapshot', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [makeVideoDoc('v1', 'Rhyme One', true), makeVideoDoc('v2', 'Hidden', false)],
      })
      const result = await fetchAllVideos()
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Rhyme One')
      expect(result[1].isActive).toBe(false)
    })

    it('returns empty array when no documents exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      const result = await fetchAllVideos()
      expect(result).toEqual([])
    })
  })

  describe('addVideo', () => {
    it('calls addDoc with isActive: true and serverTimestamp for publishedAt', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-id' })
      const input: AddVideoInput = {
        youtubeVideoId: 'abc123',
        title: 'Test Video',
        category: 'Rhymes',
        thumbnailUrl: 'https://t.jpg',
        durationSeconds: 180,
        order: 3,
      }
      await addVideo(input)
      expect(mockAddDoc).toHaveBeenCalledWith(
        'videos-col-ref',
        expect.objectContaining({ isActive: true, youtubeVideoId: 'abc123' }),
      )
    })
  })

  describe('toggleIsActive', () => {
    it('calls updateDoc with negated isActive', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)
      await toggleIsActive('video-123', true)
      expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', { isActive: false })
    })

    it('sets isActive true when current value is false', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)
      await toggleIsActive('video-123', false)
      expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', { isActive: true })
    })
  })

  describe('addNotification', () => {
    it('writes doc with status pending and sentAt null, returns doc id', async () => {
      mockAddDoc.mockResolvedValue({ id: 'notif-abc' })
      const input: AddNotificationInput = { title: 'Hi', body: 'Body', youtubeVideoId: null }
      const id = await addNotification(input)
      expect(id).toBe('notif-abc')
      expect(mockAddDoc).toHaveBeenCalledWith(
        'notifs-col-ref',
        expect.objectContaining({ status: 'pending', sentAt: null, title: 'Hi' }),
      )
    })
  })

  describe('subscribeToNotification', () => {
    it('calls onSnapshot and invokes callback with data when doc exists', () => {
      const fakeNotif = { notificationId: 'n1', status: 'sent' }
      const fakeSnap = { exists: () => true, data: () => fakeNotif }
      mockOnSnapshot.mockImplementation((_ref: unknown, cb: (s: unknown) => void) => {
        cb(fakeSnap)
        return vi.fn()
      })
      const callback = vi.fn()
      subscribeToNotification('n1', callback)
      expect(callback).toHaveBeenCalledWith(fakeNotif)
    })

    it('calls callback with null when doc does not exist', () => {
      const fakeSnap = { exists: () => false }
      mockOnSnapshot.mockImplementation((_ref: unknown, cb: (s: unknown) => void) => {
        cb(fakeSnap)
        return vi.fn()
      })
      const callback = vi.fn()
      subscribeToNotification('n1', callback)
      expect(callback).toHaveBeenCalledWith(null)
    })
  })
})
