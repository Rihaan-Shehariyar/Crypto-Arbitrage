import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  subscriptionActive: boolean;
  setToken: (token: string) => void;
  setSubscriptionActive: (active: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      subscriptionActive: false,
      setToken: (token) => set({ token }),
      setSubscriptionActive: (subscriptionActive) => set({ subscriptionActive }),
      logout: () => set({ token: null, subscriptionActive: false }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'arbitra-auth',
    }
  )
);
