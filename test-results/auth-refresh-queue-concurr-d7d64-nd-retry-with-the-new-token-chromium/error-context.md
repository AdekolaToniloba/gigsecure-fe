# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/refresh-queue.spec.ts >> concurrent expired authenticated requests share one refresh and retry with the new token
- Location: e2e/auth/refresh-queue.spec.ts:24:5

# Error details

```
AxiosError: Request failed with status code 401
```

# Test source

```ts
  1   | import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
  2   | import { expect, test } from '@playwright/test';
  3   | import { apiClient } from '../../src/lib/api/client';
  4   | import { resetRefreshQueueForTests } from '../../src/lib/api/refresh-queue';
  5   | import { useAuthStore } from '../../src/store/auth-store';
  6   | 
  7   | const originalAdapter = apiClient.defaults.adapter;
  8   | const originalFetch = globalThis.fetch;
  9   | 
  10  | type RetriedRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };
  11  | 
  12  | test.beforeEach(() => {
  13  |   resetRefreshQueueForTests();
  14  |   useAuthStore.getState().clearAuth();
  15  | });
  16  | 
  17  | test.afterEach(() => {
  18  |   apiClient.defaults.adapter = originalAdapter;
  19  |   globalThis.fetch = originalFetch;
  20  |   resetRefreshQueueForTests();
  21  |   useAuthStore.getState().clearAuth();
  22  | });
  23  | 
  24  | test('concurrent expired authenticated requests share one refresh and retry with the new token', async () => {
  25  |   useAuthStore.getState().setAccessToken(createJwt({ scope: 'authenticated', exp: 1 }));
  26  | 
  27  |   let refreshCalls = 0;
  28  |   globalThis.fetch = async () => {
  29  |     refreshCalls += 1;
  30  |     return jsonResponse({
  31  |       access_token: 'fresh-access-token',
  32  |       token_type: 'bearer',
  33  |       kyc_verified: true,
  34  |       risk_assessed: true,
  35  |     });
  36  |   };
  37  | 
  38  |   apiClient.defaults.adapter = (async (config) => {
  39  |     const retriedConfig = config as RetriedRequestConfig;
  40  |     if (retriedConfig.url === '/protected' && !retriedConfig._retry) {
  41  |       throw unauthorized(config);
  42  |     }
  43  | 
  44  |     return ok(config, {
  45  |       authorization: config.headers?.Authorization,
  46  |     });
  47  |   }) satisfies AxiosAdapter;
  48  | 
  49  |   const results = await Promise.all([
  50  |     apiClient.get('/protected'),
  51  |     apiClient.get('/protected'),
  52  |     apiClient.get('/protected'),
  53  |   ]);
  54  | 
  55  |   expect(refreshCalls).toBe(1);
  56  |   expect(results.map((result) => result.data.authorization)).toEqual([
  57  |     'Bearer fresh-access-token',
  58  |     'Bearer fresh-access-token',
  59  |     'Bearer fresh-access-token',
  60  |   ]);
  61  |   expect(useAuthStore.getState().accessToken).toBe('fresh-access-token');
  62  |   expect(useAuthStore.getState().kycVerified).toBe(true);
  63  |   expect(useAuthStore.getState().riskAssessed).toBe(true);
  64  | });
  65  | 
  66  | function unauthorized(config: InternalAxiosRequestConfig) {
> 67  |   return new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config, null, {
      |          ^ AxiosError: Request failed with status code 401
  68  |     data: { detail: 'Unauthorized' },
  69  |     status: 401,
  70  |     statusText: 'Unauthorized',
  71  |     headers: {},
  72  |     config,
  73  |   });
  74  | }
  75  | 
  76  | function ok(config: InternalAxiosRequestConfig, data: unknown): AxiosResponse {
  77  |   return {
  78  |     data,
  79  |     status: 200,
  80  |     statusText: 'OK',
  81  |     headers: {},
  82  |     config,
  83  |   };
  84  | }
  85  | 
  86  | function jsonResponse(body: unknown, init?: ResponseInit) {
  87  |   return new Response(JSON.stringify(body), {
  88  |     status: init?.status ?? 200,
  89  |     headers: { 'Content-Type': 'application/json' },
  90  |   });
  91  | }
  92  | 
  93  | function createJwt(payload: Record<string, unknown>) {
  94  |   return ['header', encodeBase64Url(JSON.stringify(payload)), 'signature'].join('.');
  95  | }
  96  | 
  97  | function encodeBase64Url(value: string) {
  98  |   return Buffer.from(value)
  99  |     .toString('base64')
  100 |     .replace(/\+/g, '-')
  101 |     .replace(/\//g, '_')
  102 |     .replace(/=+$/, '');
  103 | }
  104 | 
```
