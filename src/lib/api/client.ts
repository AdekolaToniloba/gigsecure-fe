import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { useAuthStore } from '@/store/auth-store';
import { AUTH_ENDPOINTS } from './endpoints';
import {
  parseBrowserSessionResponse,
  refreshAccessTokenOnce,
  shouldAttemptSessionRefresh,
} from './refresh-queue';

// ─── Create Axios Instance ─────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// ─── Retry Configuration ────────────────────────────────────────────
// Retries on network errors and 5xx only — never on 4xx (client faults)
axiosRetry(apiClient, {
  retries: 3,
  retryCondition: (error: AxiosError) => {
    return (
      axiosRetry.isNetworkError(error) ||
      (!!error.response && error.response.status >= 500)
    );
  },
  retryDelay: axiosRetry.exponentialDelay,
});

// ─── Request Interceptor ────────────────────────────────────────────
// Attach Bearer token from in-memory Zustand store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Only attempt refresh on 401, and not on the refresh route itself
    if (
      error.response?.status !== 401 ||
      originalRequest.url?.includes(AUTH_ENDPOINTS.REFRESH)
    ) {
      return Promise.reject(error);
    }

    // Public assessment tokens have no refresh-backed session. Route controllers
    // own their recovery, so reject the backend response without decoding JWTs.
    if (!shouldAttemptSessionRefresh(useAuthStore.getState().hasFullSession)) {
      return Promise.reject(error);
    }

    // Already retried — give up
    if (originalRequest._retry) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        const isWizardPath = window.location.pathname.startsWith('/assessment');
        window.location.href = isWizardPath ? '/waitlist?expired=true' : '/login';
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessTokenOnce(refreshAccessTokenFromBff);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        // Waitlist users have no refresh cookie — send them back to waitlist, not login
        const isWizardPath = window.location.pathname.startsWith('/assessment');
        window.location.href = isWizardPath ? '/waitlist?expired=true' : '/login';
      }
      return Promise.reject(refreshError);
    }
  }
);

async function refreshAccessTokenFromBff() {
  // Browser automatically sends the httpOnly gs_refresh_token cookie.
  const res = await fetch(AUTH_ENDPOINTS.REFRESH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!res.ok) throw new Error('Refresh failed');

  const data: unknown = await res.json();
  const session = parseBrowserSessionResponse(data);
  useAuthStore.getState().setSession({
    accessToken: session.access_token,
    kycVerified: session.kyc_verified,
    riskAssessed: session.risk_assessed,
  });
  return session.access_token;
}
