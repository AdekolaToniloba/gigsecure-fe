import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { useAuthStore } from '@/store/auth-store';
import { AUTH_ENDPOINTS } from './endpoints';

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

// ─── Response Interceptor — Silent Refresh Flow ─────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

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

    // Check if token is waitlist scoped and if it is expired
    let isWaitlist = false;
    let isExpired = false;
    const currentToken = useAuthStore.getState().accessToken;

    if (currentToken) {
      try {
        const base64Url = currentToken.split('.')[1];
        if (base64Url) {
          let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const pad = base64.length % 4;
          if (pad) base64 += '='.repeat(4 - pad);
          const payload = JSON.parse(
            decodeURIComponent(
              atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            )
          );
          isWaitlist = payload.scope === 'waitlist';
          isExpired = payload.exp * 1000 < Date.now();
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // If waitlist token is not expired, it's a scope/permission error from the backend, not an auth expiration. 
    // Waitlist tokens don't have refresh tokens, so attempting a refresh is guaranteed to fail and log them out.
    // We just reject the request so the UI can gracefully handle the API failure without nuking the session.
    if (isWaitlist && !isExpired) {
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

    // Queue concurrent requests while refresh is in flight
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Browser automatically sends the httpOnly gs_refresh_token cookie
      const res = await fetch(AUTH_ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!res.ok) throw new Error('Refresh failed');

      const data = await res.json() as { access_token: string };
      const newToken = data.access_token;

      useAuthStore.getState().setAccessToken(newToken);
      processQueue(null, newToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        // Waitlist users have no refresh cookie — send them back to waitlist, not login
        const isWizardPath = window.location.pathname.startsWith('/assessment');
        window.location.href = isWizardPath ? '/waitlist?expired=true' : '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
