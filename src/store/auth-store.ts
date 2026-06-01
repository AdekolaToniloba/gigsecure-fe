import { create } from 'zustand';
import type { components } from '@/types/schema';

type UserResponse = components['schemas']['UserResponse'];
export type AuthStatus = 'idle' | 'initializing' | 'authenticated' | 'unauthenticated';

export interface AuthSessionFlags {
  kycVerified: boolean;
  riskAssessed: boolean;
}

export interface AuthSessionPayload extends AuthSessionFlags {
  accessToken: string;
}

// ─── State ────────────────────────────────────────────────────────
interface AuthState {
  accessToken: string | null;
  firstName: string | null;
  lastName: string | null;
  user: UserResponse | null;
  kycVerified: boolean | null;
  riskAssessed: boolean | null;
  isAuthenticated: boolean;
  status: AuthStatus;
}

// ─── Actions ──────────────────────────────────────────────────────
interface AuthActions {
  setAccessToken: (token: string) => void;
  setSession: (session: AuthSessionPayload) => void;
  setFlags: (flags: Partial<AuthSessionFlags>) => void;
  setAuthInitializing: () => void;
  setUnauthenticated: () => void;
  setUser: (user: UserResponse) => void;
  setUserMeta: (firstName: string, lastName: string | null) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Store ────────────────────────────────────────────────────────
// Access tokens are intentionally memory-only. Do not wrap this store in
// Zustand persist or write tokens to browser-readable storage.
export const useAuthStore = create<AuthStore>()((set) => ({
  // State
  accessToken: null,
  firstName: null,
  lastName: null,
  user: null,
  kycVerified: null,
  riskAssessed: null,
  isAuthenticated: false,
  status: 'idle',

  // Actions
  setAccessToken: (token) =>
    set({
      accessToken: token,
      kycVerified: null,
      riskAssessed: null,
      isAuthenticated: true,
      status: 'authenticated',
    }),

  setSession: ({ accessToken, kycVerified, riskAssessed }) =>
    set({
      accessToken,
      kycVerified,
      riskAssessed,
      isAuthenticated: true,
      status: 'authenticated',
    }),

  setFlags: (flags) =>
    set((state) => ({
      kycVerified: flags.kycVerified ?? state.kycVerified,
      riskAssessed: flags.riskAssessed ?? state.riskAssessed,
    })),

  setAuthInitializing: () =>
    set({ status: 'initializing', isAuthenticated: false }),

  setUnauthenticated: () =>
    set({
      accessToken: null,
      kycVerified: null,
      riskAssessed: null,
      isAuthenticated: false,
      status: 'unauthenticated',
    }),

  setUser: (user) => set({ user }),

  setUserMeta: (firstName, lastName) => set({ firstName, lastName }),

  clearAuth: () =>
    set({
      accessToken: null,
      firstName: null,
      lastName: null,
      user: null,
      kycVerified: null,
      riskAssessed: null,
      isAuthenticated: false,
      status: 'unauthenticated',
    }),
}));
