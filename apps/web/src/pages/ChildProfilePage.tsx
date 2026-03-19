import { useLocation } from 'react-router-dom'
import { ageRangeFromDob } from '@ckd/shared/utils/ageRange'
import { useAuthStore } from '../shared/store/authStore'
import { useChildProfile } from '../features/childProfile/hooks/useChildProfile'
import { AddChildScreen } from '../features/childProfile/components/AddChildScreen'
import { useChildProfileStore } from '../shared/store/childProfileStore'

export function ChildProfilePage() {
  const location = useLocation()
  const { user } = useAuthStore()
  const activeProfile = useChildProfileStore((s) => s.activeProfile)
  const uid = user?.uid ?? ''
  const editMode = location.state?.mode === 'edit' && !!activeProfile
  const redirectTo = location.state?.returnTo === 'settings' ? '/library?panel=settings' : '/library'
  const { saving, error, saveProfile } = useChildProfile(uid, {
    existingProfileId: editMode ? activeProfile?.id : undefined,
    redirectTo,
  })

  return (
    <AddChildScreen
      onSave={saveProfile}
      saving={saving}
      error={error}
      initialName={editMode ? activeProfile?.name : ''}
      initialAgeRange={editMode && activeProfile ? ageRangeFromDob(activeProfile.dateOfBirth.toDate()) : null}
      title={editMode ? "Edit your child's profile" : "Add your child's profile"}
      subtitle={editMode ? 'Update their details for a better experience' : "We'll personalise the experience for them"}
      submitLabel={editMode ? 'Save Changes' : 'Start Watching 🎬'}
    />
  )
}
