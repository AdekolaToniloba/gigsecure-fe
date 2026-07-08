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
  // Auth
  AUTH: ['auth'] as const,

  // Users
  USER_ME: ['user', 'me'] as const,

  // Dashboard
  DASHBOARD_OVERVIEW: ['dashboard', 'overview'] as const,

  // Risk
  RISK_CATEGORIES: ['risk', 'categories'] as const,
  RISK_QUESTIONS: (category: string) => ['risk', 'questions', category] as const,
  RISK_ASSESSMENT: ['risk', 'assessment'] as const,
  RISK_HISTORY: ['risk', 'history'] as const,
  RISK_RECOMMENDATIONS: ['risk', 'recommendations'] as const,

  // KYC
  KYC_STATUS: ['kyc', 'status'] as const,

  // Marketplace
  MARKETPLACE_PRODUCTS: (filters: object) => ['marketplace', 'products', filters] as const,
  MARKETPLACE_PRODUCT: (id: string) => ['marketplace', 'products', id] as const,
  MARKETPLACE_RECOMMENDATIONS: (perCategory?: number) =>
    perCategory === undefined
      ? ['marketplace', 'recommendations'] as const
      : ['marketplace', 'recommendations', perCategory] as const,

  // Legacy products
  PRODUCTS: ['products'] as const,
  PRODUCTS_FEATURED: ['products', 'featured'] as const,
  PRODUCT: (id: string) => ['products', id] as const,

  // Policies
  POLICIES: ['policies'] as const,
  POLICY: (id: string) => ['policies', id] as const,

  // Claims
  CLAIMS: ['claims'] as const,
  CLAIM: (id: string) => ['claims', id] as const,
  CLAIM_STATUS: (id: string) => ['claims', id, 'status'] as const,

  // Payments
  PAYMENTS: ['payments'] as const,
  PAYMENT: (id: string) => ['payments', id] as const,
  PAYMENTS_HISTORY: ['payments', 'history'] as const,
} as const;

// ─── App-wide constants ────────────────────────────────────────────
export const APP_NAME = 'GigSecure';
