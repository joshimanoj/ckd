import { describe, it, expect, expectTypeOf } from 'vitest'
import type { WatchSession, WatchSessionInput, DeviceType } from '../watchSession'
import { Timestamp } from 'firebase/firestore'

describe('WatchSession interface', () => {
  it('satisfies all required fields', () => {
    const session: WatchSession = {
      sessionId: 'sess-1',
      youtubeVideoId: 'abc123',
      videoDurationSeconds: 180,
      watchedSeconds: 45,
      completionPercent: 25,
      startTime: Timestamp.now(),
      endTime: null,
      deviceType: 'web',
      createdAt: Timestamp.now(),
    }
    expect(session.sessionId).toBe('sess-1')
    expect(session.deviceType).toBe('web')
  })

  it('DeviceType accepts web and android', () => {
    const web: DeviceType = 'web'
    const android: DeviceType = 'android'
    expect(web).toBe('web')
    expect(android).toBe('android')
  })

  it('WatchSessionInput omits sessionId and createdAt', () => {
    const input: WatchSessionInput = {
      youtubeVideoId: 'abc123',
      videoDurationSeconds: 180,
      watchedSeconds: 45,
      completionPercent: 25,
      startTime: Timestamp.now(),
      endTime: null,
      deviceType: 'web',
    }
    expectTypeOf(input).not.toHaveProperty('sessionId')
    expectTypeOf(input).not.toHaveProperty('createdAt')
    expect(input.youtubeVideoId).toBe('abc123')
  })
})
