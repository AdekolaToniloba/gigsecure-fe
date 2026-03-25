// ─── App Routes ──────────────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

// ─── React Query Cache Keys ──────────────────────────────────────
export const QUERY_KEYS = {
  USER: 'user',
  USERS: 'users',
  PROFILE: 'profile',
  DASHBOARD: 'dashboard',
} as const;

export type QueryKey = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS];

// ─── App-wide constants ────────────────────────────────────────────
export const APP_NAME = 'GigSecure';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
