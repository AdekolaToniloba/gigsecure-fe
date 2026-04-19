// ─── Auth ──────────────────────────────────────────────────────────
// All auth routes go through Next.js BFF — never call backend auth directly
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  WAITLIST: '/api/auth/waitlist',
} as const;

// ─── Backend endpoints (via Axios client, not BFF) ─────────────────
export const ENDPOINTS = {
  AUTH: {
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    ACTIVATE: '/api/v1/auth/activate',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    RESEND_ACTIVATION: '/api/v1/auth/resend-activation',
  },
  USERS: {
    ME: '/api/v1/users/me',
  },
  RISK: {
    CATEGORIES: '/api/v1/risk/categories',
    QUESTIONS: '/api/v1/risk/questions',
    ASSESSMENT: '/api/v1/risk/assessment',
    HISTORY: '/api/v1/risk/history',
    RECOMMENDATIONS: '/api/v1/risk/recommendations',
  },
  PRODUCTS: {
    LIST: '/api/v1/products/',
    FEATURED: '/api/v1/products/featured',
    DETAIL: (id: string) => `/api/v1/products/${id}`,
  },
  POLICIES: {
    LIST: '/api/v1/policies/',
    CREATE: '/api/v1/policies/',
    DETAIL: (id: string) => `/api/v1/policies/${id}`,
    CANCEL: (id: string) => `/api/v1/policies/${id}/cancel`,
    RENEW: (id: string) => `/api/v1/policies/${id}/renew`,
  },
  CLAIMS: {
    LIST: '/api/v1/claims/',
    SUBMIT: '/api/v1/claims/',
    DETAIL: (id: string) => `/api/v1/claims/${id}`,
    DOCUMENTS: (id: string) => `/api/v1/claims/${id}/documents`,
    STATUS: (id: string) => `/api/v1/claims/${id}/status`,
  },
  PAYMENTS: {
    INITIALIZE: '/api/v1/payments/initialize',
    DETAIL: (id: string) => `/api/v1/payments/${id}`,
    HISTORY: '/api/v1/payments/history',
  },
  ADMIN: {
    LOGIN: '/api/v1/admin/auth/login',
    DASHBOARD: '/api/v1/admin/dashboard',
    USERS: '/api/v1/admin/users',
    USER_DETAIL: (id: string) => `/api/v1/admin/users/${id}`,
    USER_STATUS: (id: string) => `/api/v1/admin/users/${id}/status`,
    CLAIMS: '/api/v1/admin/claims',
    CLAIM_DETAIL: (id: string) => `/api/v1/admin/claims/${id}`,
    CLAIM_REVIEW: (id: string) => `/api/v1/admin/claims/${id}/review`,
    POLICIES: '/api/v1/admin/policies',
    ANALYTICS_CLAIMS: '/api/v1/admin/analytics/claims',
    ANALYTICS_USERS: '/api/v1/admin/analytics/users',
    ANALYTICS_REVENUE: '/api/v1/admin/analytics/revenue',
  },
} as const;
