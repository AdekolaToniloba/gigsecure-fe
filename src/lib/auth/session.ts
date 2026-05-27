import { AUTH_ENDPOINTS } from '@/lib/api/endpoints';
import { browserTokenResponseSchema } from '@/lib/validators/auth';
import { useAuthStore } from '@/store/auth-store';
import type { BrowserTokenResponse } from '@/types/auth';

type Fetcher = typeof fetch;

export async function refreshSession(fetcher: Fetcher = fetch): Promise<BrowserTokenResponse> {
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
  return browserTokenResponseSchema.parse(data);
}

export async function initializeAuthSession(fetcher: Fetcher = fetch): Promise<void> {
  const authStore = useAuthStore.getState();
  authStore.setAuthInitializing();

  try {
    const session = await refreshSession(fetcher);
    useAuthStore.getState().setSession({
      accessToken: session.access_token,
      kycVerified: session.kyc_verified,
      riskAssessed: session.risk_assessed,
    });
  } catch {
    useAuthStore.getState().setUnauthenticated();
  }
}
