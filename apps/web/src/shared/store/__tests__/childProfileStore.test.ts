import { describe, it, expect, beforeEach } from 'vitest'
import { useChildProfileStore } from '../childProfileStore'
import { Timestamp } from 'firebase/firestore'

const mockProfile = {
  id: 'profile-1',
  name: 'Arjun',
  dateOfBirth: Timestamp.now(),
  createdAt: Timestamp.now(),
}

describe('childProfileStore', () => {
  beforeEach(() => {
    useChildProfileStore.setState({ activeProfile: null })
  })

  it('initialises with activeProfile null', () => {
    expect(useChildProfileStore.getState().activeProfile).toBeNull()
  })

  it('setActiveProfile stores the profile', () => {
    useChildProfileStore.getState().setActiveProfile(mockProfile)
    expect(useChildProfileStore.getState().activeProfile).toEqual(mockProfile)
  })

  it('clearActiveProfile resets to null', () => {
    useChildProfileStore.getState().setActiveProfile(mockProfile)
    useChildProfileStore.getState().clearActiveProfile()
    expect(useChildProfileStore.getState().activeProfile).toBeNull()
  })
})
