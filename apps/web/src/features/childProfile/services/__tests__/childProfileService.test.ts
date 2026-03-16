import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { createChildProfile, getChildProfiles, _setDbForTesting } from '../childProfileService'

const TEST_PROJECT = 'ckd-test'

const testApp = initializeApp({ projectId: TEST_PROJECT }, 'childProfileServiceTest')
const testDb = getFirestore(testApp)

beforeAll(() => {
  try {
    connectFirestoreEmulator(testDb, '127.0.0.1', 8080)
  } catch {
    // already connected
  }
  _setDbForTesting(testDb)
})

afterEach(async () => {
  await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${TEST_PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' },
  ).catch(() => {})
})

describe('childProfileService (integration — requires emulator)', () => {
  it.skipIf(!process.env['FIREBASE_EMULATOR_RUNNING'])(
    'createChildProfile writes correct fields and returns ChildProfile',
    async () => {
      const profile = await createChildProfile('uid-test-1', 'Arjun', '3-4')
      expect(profile.name).toBe('Arjun')
      expect(profile.id).toBeTruthy()
      expect(profile.dateOfBirth).toBeDefined()
      expect(profile.createdAt).toBeDefined()

      // dateOfBirth should be approx 3.5 years ago (±60 days)
      const expectedMs = Date.now() - 42 * 30 * 24 * 60 * 60 * 1000
      const dobMs = profile.dateOfBirth.toMillis()
      expect(Math.abs(dobMs - expectedMs)).toBeLessThan(60 * 24 * 60 * 60 * 1000)
    },
  )

  it.skipIf(!process.env['FIREBASE_EMULATOR_RUNNING'])(
    'createChildProfile trims whitespace from name',
    async () => {
      const profile = await createChildProfile('uid-test-2', '  Arjun  ', 'under-3')
      expect(profile.name).toBe('Arjun')
    },
  )

  it.skipIf(!process.env['FIREBASE_EMULATOR_RUNNING'])(
    'getChildProfiles returns created profiles',
    async () => {
      await createChildProfile('uid-test-3', 'Priya', '5-6')
      const profiles = await getChildProfiles('uid-test-3')
      expect(profiles).toHaveLength(1)
      expect(profiles[0]?.name).toBe('Priya')
    },
  )

  it.skipIf(!process.env['FIREBASE_EMULATOR_RUNNING'])(
    'getChildProfiles returns empty array when none exist',
    async () => {
      const profiles = await getChildProfiles('uid-no-profiles')
      expect(profiles).toEqual([])
    },
  )
})
