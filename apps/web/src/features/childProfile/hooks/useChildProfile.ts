import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
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

  async function saveProfile(name: string, ageRange: AgeRange) {
    setSaving(true)
    setError(null)
    try {
      const profile = await createChildProfile(uid, name, ageRange)
      setActiveProfile(profile)
      navigate('/library')
    } catch {
      setError("Couldn't save profile. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return { saving, error, saveProfile }
}
