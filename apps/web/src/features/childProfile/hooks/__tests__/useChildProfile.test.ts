import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChildProfile } from '../useChildProfile'
import * as childProfileService from '../../services/childProfileService'
import { useChildProfileStore } from '../../../../shared/store/childProfileStore'
import { Timestamp } from 'firebase/firestore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

vi.mock('../../services/childProfileService', () => ({
  createChildProfile: vi.fn(),
  updateChildProfile: vi.fn(),
}))

const mockProfile = {
  id: 'p1',
  name: 'Arjun',
  dateOfBirth: Timestamp.now(),
  createdAt: Timestamp.now(),
}

describe('useChildProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChildProfileStore.setState({ activeProfile: null })
  })

  it('saveProfile on success: sets store, navigates to /library', async () => {
    vi.mocked(childProfileService.createChildProfile).mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useChildProfile('uid-1'))

    await act(async () => {
      await result.current.saveProfile('Arjun', '3-4')
    })

    expect(childProfileService.createChildProfile).toHaveBeenCalledWith('uid-1', 'Arjun', '3-4')
    expect(useChildProfileStore.getState().activeProfile).toEqual(mockProfile)
    expect(mockNavigate).toHaveBeenCalledWith('/library')
    expect(result.current.saving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('saveProfile on failure: sets error, does not navigate', async () => {
    vi.mocked(childProfileService.createChildProfile).mockRejectedValue(new Error('Firestore error'))

    const { result } = renderHook(() => useChildProfile('uid-1'))

    await act(async () => {
      await result.current.saveProfile('Arjun', '3-4')
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(result.current.error).toBe("Couldn't save profile. Try again.")
    expect(result.current.saving).toBe(false)
  })

  it('updates an existing profile and returns to settings route when configured', async () => {
    vi.mocked(childProfileService.updateChildProfile).mockResolvedValue(mockProfile)

    const { result } = renderHook(() =>
      useChildProfile('uid-1', { existingProfileId: 'p1', redirectTo: '/library?panel=settings' }),
    )

    await act(async () => {
      await result.current.saveProfile('Arjun', '3-4')
    })

    expect(childProfileService.updateChildProfile).toHaveBeenCalledWith('uid-1', 'p1', 'Arjun', '3-4')
    expect(mockNavigate).toHaveBeenCalledWith('/library?panel=settings')
  })
})
