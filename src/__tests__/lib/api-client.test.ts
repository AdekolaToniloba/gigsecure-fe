import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { apiClient } from '@/lib/api/client';
import { resetRefreshQueueForTests } from '@/lib/api/refresh-queue';
import { useAuthStore } from '@/store/auth-store';

const originalAdapter = apiClient.defaults.adapter;

type RetriedRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

beforeEach(() => {
  resetRefreshQueueForTests();
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
});

describe('apiClient refresh handling', () => {
  it('sends one refresh request for concurrent 401s and retries with the new access token', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'authenticated-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      const retriedConfig = config as RetriedRequestConfig;
      if (retriedConfig.url === '/protected' && !retriedConfig._retry) {
        throw unauthorized(config);
      }

      return ok(config, {
        authorization: config.headers?.Authorization,
      });
    });
    apiClient.defaults.adapter = adapter;

    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        access_token: 'fresh-access-token',
        token_type: 'bearer',
        kyc_verified: true,
        risk_assessed: false,
      })
    );

    const results = await Promise.all([
      apiClient.get('/protected'),
      apiClient.get('/protected'),
      apiClient.get('/protected'),
    ]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    expect(results.map((result) => result.data.authorization)).toEqual([
      'Bearer fresh-access-token',
      'Bearer fresh-access-token',
      'Bearer fresh-access-token',
    ]);
    expect(useAuthStore.getState().accessToken).toBe('fresh-access-token');
    expect(useAuthStore.getState().kycVerified).toBe(true);
    expect(useAuthStore.getState().riskAssessed).toBe(false);
    expect(useAuthStore.getState().hasFullSession).toBe(true);
  });

  it('clears auth state when refresh fails', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'authenticated-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    apiClient.defaults.adapter = vi.fn<AxiosAdapter>(async (config) => {
      throw unauthorized(config);
    });

    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ detail: 'No refresh token' }, { status: 401 })
    );

    await expect(apiClient.get('/protected')).rejects.toThrow('Refresh failed');

    const state = useAuthStore.getState();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(state.accessToken).toBeNull();
    expect(state.kycVerified).toBeNull();
    expect(state.riskAssessed).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.hasFullSession).toBe(false);
    expect(state.status).toBe('unauthenticated');
  });

  it('does not refresh waitlist tokens on backend 401 responses', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('waitlist-access-token');
    });

    apiClient.defaults.adapter = vi.fn<AxiosAdapter>(async (config) => {
      throw unauthorized(config);
    });

    await expect(apiClient.get('/risk/history')).rejects.toBeInstanceOf(AxiosError);

    expect(fetch).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).not.toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().hasFullSession).toBe(false);
  });
});

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config, null, {
    data: { detail: 'Unauthorized' },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  });
}

function ok(config: InternalAxiosRequestConfig, data: unknown): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
