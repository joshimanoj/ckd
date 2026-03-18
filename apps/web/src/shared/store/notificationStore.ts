import { create } from 'zustand'

interface NotificationState {
  notificationsEnabled: boolean
  fcmToken: string | null
  promptShown: boolean
  setNotificationsEnabled: (enabled: boolean) => void
  setFcmToken: (token: string | null) => void
  setPromptShown: (shown: boolean) => void
  reset: () => void
}

const initialState = {
  notificationsEnabled: false,
  fcmToken: null as string | null,
  promptShown: false,
}

export const useNotificationStore = create<NotificationState>((set) => ({
  ...initialState,
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setFcmToken: (token) => set({ fcmToken: token }),
  setPromptShown: (shown) => set({ promptShown: shown }),
  reset: () => set(initialState),
}))
