import { create } from 'zustand'
import type { ChildProfile } from '@ckd/shared/types/user'

interface ChildProfileState {
  activeProfile: ChildProfile | null
  setActiveProfile: (profile: ChildProfile | null) => void
  clearActiveProfile: () => void
}

export const useChildProfileStore = create<ChildProfileState>()((set) => ({
  activeProfile: null,
  setActiveProfile: (profile) => set({ activeProfile: profile }),
  clearActiveProfile: () => set({ activeProfile: null }),
}))
