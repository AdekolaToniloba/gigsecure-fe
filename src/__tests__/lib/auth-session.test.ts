import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { initializeAuthSession, refreshSession } from '@/lib/auth/session';
import { useAuthStore } from '@/store/auth-store';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
  });
  vi.restoreAllMocks();
});

describe('refreshSession', () => {
  it('calls the refresh BFF and returns the access token', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        access_token: 'new-access-token',
        token_type: 'bearer',
        kyc_verified: true,
        risk_assessed: false,
      })
    );

    await expect(refreshSession(fetcher)).resolves.toEqual({
      access_token: 'new-access-token',
      token_type: 'bearer',
      kyc_verified: true,
      risk_assessed: false,
    });

    expect(fetcher).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  });

  it('rejects when silent refresh fails', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({ detail: 'No refresh token' }, { status: 401 })
    );

    await expect(refreshSession(fetcher)).rejects.toThrow('Silent refresh failed');
  });
});

describe('initializeAuthSession', () => {
  it('sets initializing then authenticated when refresh succeeds', async () => {
    const observedStatuses: string[] = [];
    const unsubscribe = useAuthStore.subscribe((state) => {
      observedStatuses.push(state.status);
    });
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        access_token: 'boot-access-token',
        token_type: 'bearer',
        kyc_verified: false,
        risk_assessed: true,
      })
    );

    await initializeAuthSession(fetcher);
    unsubscribe();

    const state = useAuthStore.getState();
    expect(observedStatuses).toEqual(['initializing', 'authenticated']);
    expect(state.accessToken).toBe('boot-access-token');
    expect(state.kycVerified).toBe(false);
    expect(state.riskAssessed).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.hasFullSession).toBe(true);
    expect(state.status).toBe('authenticated');
  });

  it('sets unauthenticated when refresh fails', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({ detail: 'No refresh token' }, { status: 401 })
    );

    await initializeAuthSession(fetcher);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.kycVerified).toBeNull();
    expect(state.riskAssessed).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.hasFullSession).toBe(false);
    expect(state.status).toBe('unauthenticated');
  });

  it('does not persist refreshed access tokens to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        access_token: 'boot-access-token',
        token_type: 'bearer',
        kyc_verified: false,
        risk_assessed: false,
      })
    );

    await initializeAuthSession(fetcher);

    expect(localStorage.getItem('gigsecure-auth')).toBeNull();
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
