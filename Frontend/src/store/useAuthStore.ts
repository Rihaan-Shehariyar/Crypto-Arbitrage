import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {

  id: string

  name: string

  email: string

  subscription_active: boolean

  trading_enabled: boolean
}

interface AuthState {

  token: string | null

  user: User | null

  hydrated: boolean

  setToken: (
    token: string | null,
  ) => void

  setUser: (
    user: User | null,
  ) => void

  setHydrated: (
    hydrated: boolean,
  ) => void

  logout: () => void
}

export const useAuthStore =
  create<AuthState>()(

    persist(

      (set) => ({

        token: null,

        user: null,

        hydrated: false,

        setToken: (token) =>
          set({ token }),

        setUser: (user) =>
          set({ user }),

        setHydrated: (
          hydrated,
        ) =>
          set({ hydrated }),

        logout: () =>
          set({

            token: null,

            user: null,

            hydrated: false,
          }),
      }),

      {
        name: 'arbitra-auth',
      },
    ),
  )