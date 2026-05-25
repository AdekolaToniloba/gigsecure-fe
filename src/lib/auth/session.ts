import { AUTH_ENDPOINTS } from '@/lib/api/endpoints';
import { browserTokenResponseSchema } from '@/lib/validators/auth';
import { useAuthStore } from '@/store/auth-store';

type Fetcher = typeof fetch;

export async function refreshSession(fetcher: Fetcher = fetch): Promise<string> {
  const res = await fetcher(AUTH_ENDPOINTS.REFRESH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!res.ok) {
    throw new Error('Silent refresh failed');
  }

  const data: unknown = await res.json();
  return browserTokenResponseSchema.parse(data).access_token;
}

export async function initializeAuthSession(fetcher: Fetcher = fetch): Promise<void> {
  const authStore = useAuthStore.getState();
  authStore.setAuthInitializing();

  try {
    const accessToken = await refreshSession(fetcher);
    useAuthStore.getState().setAccessToken(accessToken);
  } catch {
    useAuthStore.getState().setUnauthenticated();
  }
}
