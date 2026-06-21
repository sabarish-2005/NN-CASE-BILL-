import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      dark:        false,
      sidebarOpen: true,
      toggleDark:  () => set(s => ({ dark: !s.dark })),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar:  (v) => set({ sidebarOpen: v }),
    }),
    { name: 'nn-ui' }
  )
)
