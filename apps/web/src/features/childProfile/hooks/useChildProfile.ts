import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
import { useAuthStore } from '../../../shared/store/authStore'
import { createChildProfile, updateChildProfile } from '../services/childProfileService'
import type { AgeRange } from '@ckd/shared/utils/ageRange'

interface UseChildProfileResult {
  saving: boolean
  error: string | null
  saveProfile: (name: string, ageRange: AgeRange) => Promise<void>
}

interface UseChildProfileOptions {
  existingProfileId?: string
  redirectTo?: string
}

export function useChildProfile(uid: string, options: UseChildProfileOptions = {}): UseChildProfileResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setActiveProfile = useChildProfileStore((s) => s.setActiveProfile)
  const setRouteTo = useAuthStore((s) => s.setRouteTo)

  async function saveProfile(name: string, ageRange: AgeRange) {
    setSaving(true)
    setError(null)
    try {
      const profile = options.existingProfileId
        ? await updateChildProfile(uid, options.existingProfileId, name, ageRange)
        : await createChildProfile(uid, name, ageRange)
      setActiveProfile(profile)
      setRouteTo('library')
      navigate(options.redirectTo ?? '/library')
    } catch {
      setError("Couldn't save profile. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return { saving, error, saveProfile }
}
