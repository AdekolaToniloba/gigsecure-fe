import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SETTINGS_STALE_TIME,
  useDeactivateAccount,
  useDeleteAccount,
  useNotificationSettings,
  usePrivacySettings,
  useUpdateNotificationSetting,
  useUpdatePrivacySetting,
} from '@/hooks/settings/useSettings';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { QUERY_KEYS } from '@/lib/constants';
import {
  notificationPrefsFixture,
  privacySettingsFixture,
} from '@/mocks/fixtures/settings';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const NOTIFICATIONS_URL = `${BASE}${ENDPOINTS.SETTINGS.NOTIFICATIONS}`;
const ACCOUNT_DEACTIVATE_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT_DEACTIVATE}`;
const ACCOUNT_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT}`;

beforeEach(() => {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'settings-hook-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
});

describe('settings hooks', () => {
  it('loads notification and privacy settings with explicit cache policy', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => ({
      notifications: useNotificationSettings(),
      privacy: usePrivacySettings(),
    }), { wrapper: Wrapper });

    expect(result.current.notifications.isLoading).toBe(true);
    expect(result.current.privacy.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.notifications.isSuccess).toBe(true);
      expect(result.current.privacy.isSuccess).toBe(true);
    });

    expect(result.current.notifications.data).toEqual(notificationPrefsFixture);
    expect(result.current.privacy.data).toEqual(privacySettingsFixture);
    expect(queryClient.getQueryState(QUERY_KEYS.SETTINGS_NOTIFICATIONS)?.dataUpdatedAt)
      .toBeGreaterThan(0);
    expect(SETTINGS_STALE_TIME).toBe(300_000);
  });

  it('keeps settings queries idle until enabled', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrivacySettings({ enabled: false }), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('optimistically updates notification toggles and rolls back failed mutations without retry', async () => {
    let requests = 0;
    server.use(
      http.put(NOTIFICATIONS_URL, () => {
        requests += 1;
        return HttpResponse.json({ detail: 'Could not save notification preference.' }, { status: 422 });
      }),
    );
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(QUERY_KEYS.SETTINGS_NOTIFICATIONS, notificationPrefsFixture);
    const { result } = renderHook(() => useUpdateNotificationSetting(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ key: 'product_updates', value: true }))
        .rejects.toMatchObject({ response: { status: 422 } });
    });

    expect(requests).toBe(1);
    expect(queryClient.getQueryData(QUERY_KEYS.SETTINGS_NOTIFICATIONS)).toEqual(
      notificationPrefsFixture,
    );
  });

  it('updates privacy toggle cache with the successful server response', async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(QUERY_KEYS.SETTINGS_PRIVACY, privacySettingsFixture);
    const { result } = renderHook(() => useUpdatePrivacySetting(), { wrapper: Wrapper });

    await result.current.mutateAsync({ key: 'share_data_with_partners', value: true });

    expect(queryClient.getQueryData(QUERY_KEYS.SETTINGS_PRIVACY)).toMatchObject({
      share_data_with_partners: true,
    });
  });

  it('exposes account action mutations without automatic retry', async () => {
    let deactivateRequests = 0;
    let deleteRequests = 0;
    server.use(
      http.post(ACCOUNT_DEACTIVATE_URL, () => {
        deactivateRequests += 1;
        return HttpResponse.json({ detail: 'Try later.' }, { status: 403 });
      }),
      http.delete(ACCOUNT_URL, () => {
        deleteRequests += 1;
        return HttpResponse.json({ detail: 'Wrong password.' }, { status: 422 });
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => ({
      deactivate: useDeactivateAccount(),
      deleteAccount: useDeleteAccount(),
    }), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.deactivate.mutateAsync()).rejects.toMatchObject({
        response: { status: 403 },
      });
      await expect(result.current.deleteAccount.mutateAsync({ password: 'bad-password' }))
        .rejects.toMatchObject({ response: { status: 422 } });
    });

    expect(deactivateRequests).toBe(1);
    expect(deleteRequests).toBe(1);
  });
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}
