import { create } from 'zustand'

interface NotificationState {
  notificationsEnabled: boolean
  fcmToken: string | null
  promptShown: boolean
  setNotificationsEnabled: (enabled: boolean) => void
  setFcmToken: (token: string | null) => void
  setPromptShown: (shown: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notificationsEnabled: false,
  fcmToken: null,
  promptShown: false,
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setFcmToken: (token) => set({ fcmToken: token }),
  setPromptShown: (shown) => set({ promptShown: shown }),
}))
