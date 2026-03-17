import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
import { useAuthStore } from '../../../shared/store/authStore'
import { createChildProfile } from '../services/childProfileService'
import type { AgeRange } from '@ckd/shared/utils/ageRange'

interface UseChildProfileResult {
  saving: boolean
  error: string | null
  saveProfile: (name: string, ageRange: AgeRange) => Promise<void>
}

export function useChildProfile(uid: string): UseChildProfileResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setActiveProfile = useChildProfileStore((s) => s.setActiveProfile)
  const setRouteTo = useAuthStore((s) => s.setRouteTo)

  async function saveProfile(name: string, ageRange: AgeRange) {
    setSaving(true)
    setError(null)
    try {
      const profile = await createChildProfile(uid, name, ageRange)
      setActiveProfile(profile)
      // Update routeTo before navigating so AuthGuard allows /library
      setRouteTo('library')
      navigate('/library')
    } catch {
      setError("Couldn't save profile. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return { saving, error, saveProfile }
}
