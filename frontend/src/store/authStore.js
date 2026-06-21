import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuth: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        set({ user: data.user, token: data.token, isAuth: true })
        return data
      },

      register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        set({ user: data.user, token: data.token, isAuth: true })
        return data
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ user: null, token: null, isAuth: false })
      },

      updateSettings: async (settings) => {
        const { data } = await api.put('/auth/settings', settings)
        set({ user: data.user })
        return data
      },

      setToken: (token) => {
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'nn-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
