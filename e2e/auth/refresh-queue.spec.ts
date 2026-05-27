import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { expect, test } from '@playwright/test';
import { apiClient } from '../../src/lib/api/client';
import { resetRefreshQueueForTests } from '../../src/lib/api/refresh-queue';
import { useAuthStore } from '../../src/store/auth-store';

const originalAdapter = apiClient.defaults.adapter;
const originalFetch = globalThis.fetch;

type RetriedRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

test.beforeEach(() => {
  resetRefreshQueueForTests();
  useAuthStore.getState().clearAuth();
});

test.afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  globalThis.fetch = originalFetch;
  resetRefreshQueueForTests();
  useAuthStore.getState().clearAuth();
});

test('concurrent expired authenticated requests share one refresh and retry with the new token', async () => {
  useAuthStore.getState().setAccessToken(createJwt({ scope: 'authenticated', exp: 1 }));

  let refreshCalls = 0;
  globalThis.fetch = async () => {
    refreshCalls += 1;
    return jsonResponse({
      access_token: 'fresh-access-token',
      token_type: 'bearer',
    });
  };

  apiClient.defaults.adapter = (async (config) => {
    const retriedConfig = config as RetriedRequestConfig;
    if (retriedConfig.url === '/protected' && !retriedConfig._retry) {
      throw unauthorized(config);
    }

    return ok(config, {
      authorization: config.headers?.Authorization,
    });
  }) satisfies AxiosAdapter;

  const results = await Promise.all([
    apiClient.get('/protected'),
    apiClient.get('/protected'),
    apiClient.get('/protected'),
  ]);

  expect(refreshCalls).toBe(1);
  expect(results.map((result) => result.data.authorization)).toEqual([
    'Bearer fresh-access-token',
    'Bearer fresh-access-token',
    'Bearer fresh-access-token',
  ]);
  expect(useAuthStore.getState().accessToken).toBe('fresh-access-token');
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

function createJwt(payload: Record<string, unknown>) {
  return ['header', encodeBase64Url(JSON.stringify(payload)), 'signature'].join('.');
}

function encodeBase64Url(value: string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
