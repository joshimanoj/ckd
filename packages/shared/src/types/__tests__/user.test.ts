import { describe, it, expect } from 'vitest'
import { isUser, isChildProfile } from '../user'
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

describe('isChildProfile', () => {
  it('should return true for a valid ChildProfile', () => {
    expect(
      isChildProfile({
        name: 'Arjun',
        dateOfBirth: Timestamp.now(),
        createdAt: Timestamp.now(),
      }),
    ).toBe(true)
  })

  it('should return false when name is missing', () => {
    expect(isChildProfile({ dateOfBirth: Timestamp.now(), createdAt: Timestamp.now() })).toBe(false)
  })

  it('should return false when name is empty string', () => {
    expect(
      isChildProfile({ name: '', dateOfBirth: Timestamp.now(), createdAt: Timestamp.now() }),
    ).toBe(false)
  })

  it('should return false when dateOfBirth is missing', () => {
    expect(isChildProfile({ name: 'Arjun', createdAt: Timestamp.now() })).toBe(false)
  })

  it('should return false when createdAt is missing', () => {
    expect(isChildProfile({ name: 'Arjun', dateOfBirth: Timestamp.now() })).toBe(false)
  })

  it('should return false for null', () => {
    expect(isChildProfile(null)).toBe(false)
  })
})
