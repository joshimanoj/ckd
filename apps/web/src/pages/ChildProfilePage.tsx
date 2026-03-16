import { useAuthStore } from '../shared/store/authStore'
import { useChildProfile } from '../features/childProfile/hooks/useChildProfile'
import { AddChildScreen } from '../features/childProfile/components/AddChildScreen'

export function ChildProfilePage() {
  const { user } = useAuthStore()
  const uid = user?.uid ?? ''
  const { saving, error, saveProfile } = useChildProfile(uid)
  return <AddChildScreen onSave={saveProfile} saving={saving} error={error} />
}
