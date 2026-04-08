import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { components } from '@/types/schema';

type UserResponse = components['schemas']['UserResponse'];

// ─── State ────────────────────────────────────────────────────────
interface AuthState {
  accessToken: string | null;
  firstName: string | null;
  lastName: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────
interface AuthActions {
  setAccessToken: (token: string) => void;
  setUser: (user: UserResponse) => void;
  setUserMeta: (firstName: string, lastName: string | null) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Store ────────────────────────────────────────────────────────
// Token is persisted to localStorage so the wizard flow survives page refresh.
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      accessToken: null,
      firstName: null,
      lastName: null,
      user: null,
      isAuthenticated: false,

      // Actions
      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      setUserMeta: (firstName, lastName) => set({ firstName, lastName }),

      clearAuth: () =>
        set({
          accessToken: null,
          firstName: null,
          lastName: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'gigsecure-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : localStorage
      ),
      partialize: (state) => ({
        accessToken: state.accessToken,
        firstName: state.firstName,
        lastName: state.lastName,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
