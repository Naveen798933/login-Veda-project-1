import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@collaboration/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        console.log('[AuthStore] setAuth called for user:', user.email);
        set({ user, accessToken, isAuthenticated: true });
        console.log('[AuthStore] Auth state updated');
      },
      logout: () => {
        console.log('[AuthStore] Logging out');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      updateAccessToken: (accessToken) => {
        console.log('[AuthStore] Updating access token');
        set({ accessToken });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
