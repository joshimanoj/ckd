import { describe, it, expect } from 'vitest'
import { isUser } from '../user'
import { Timestamp } from 'firebase/firestore'

describe('isUser', () => {
  it('should validate User shape correctly', () => {
    const validUser = {
      uid: 'abc123',
      email: 'test@example.com',
      displayName: 'Test User',
      fcmToken: null,
      notificationsEnabled: false,
      consentGiven: false,
      consentTimestamp: null,
      createdAt: Timestamp.now(),
    }

    expect(isUser(validUser)).toBe(true)

    const missingConsentGiven = {
      uid: 'abc123',
      email: 'test@example.com',
      displayName: 'Test User',
      fcmToken: null,
      notificationsEnabled: false,
      consentTimestamp: null,
      createdAt: Timestamp.now(),
    }

    expect(isUser(missingConsentGiven)).toBe(false)
  })
})
