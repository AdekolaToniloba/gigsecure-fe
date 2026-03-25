import { create } from 'zustand';
import type { components } from '@/types/schema';

type UserResponse = components['schemas']['UserResponse'];

// ─── State ────────────────────────────────────────────────────────
interface AuthState {
  /** In-memory only. Intentionally lost on page refresh — silent refresh restores it. */
  accessToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────
interface AuthActions {
  setAccessToken: (token: string) => void;
  setUser: (user: UserResponse) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Store ────────────────────────────────────────────────────────
// NOTE: No persist middleware — access token must live in memory only.
export const useAuthStore = create<AuthStore>((set) => ({
  // State
  accessToken: null,
  user: null,
  isAuthenticated: false,

  // Actions
  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: true }),

  setUser: (user) => set({ user }),

  clearAuth: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}));
