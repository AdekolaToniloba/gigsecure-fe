import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import { useCurrentUser, useUpdateProfile } from '@/hooks/user/useUser';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { server } from '@/mocks/server';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

beforeEach(() => {
  vi.restoreAllMocks();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('user profile hooks', () => {
  it('hydrates the authenticated user profile and syncs flags into the auth store', async () => {
    act(() => {
      setFullSession();
    });

    const { result } = renderHook(() => useUserProfile(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(result.current.data?.profile).toBeNull();
    expect(result.current.data?.kyc_verified).toBe(false);
    expect(result.current.data?.risk_assessed).toBe(true);
    expect(state.user?.email).toBe('test@gigsecure.com');
    expect(state.kycVerified).toBe(false);
    expect(state.riskAssessed).toBe(true);
  });

  it('skips /users/me for waitlist tokens without decoding token scope', async () => {
    const getMeSpy = vi.spyOn(userService, 'getMe');
    act(() => {
      useAuthStore.getState().setAccessToken('opaque-waitlist-token');
    });

    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(getMeSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().kycVerified).toBeNull();
    expect(useAuthStore.getState().riskAssessed).toBeNull();
    expect(useAuthStore.getState().hasFullSession).toBe(false);
  });

  it('does not treat unresolved waitlist flags as full-session loading', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('opaque-waitlist-token');
    });

    const { result } = renderHook(() => useUserFlags());

    expect(result.current.hasResolvedFlags).toBe(false);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'opaque-full-session-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    await waitFor(() => {
      expect(result.current.hasResolvedFlags).toBe(true);
    });
    expect(result.current.isKycVerified).toBe(true);
    expect(result.current.isRiskAssessed).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('syncs flags after profile updates', async () => {
    act(() => {
      setFullSession();
    });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ city: 'Lagos' });
    });

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('test@gigsecure.com');
    expect(state.kycVerified).toBe(false);
    expect(state.riskAssessed).toBe(true);
  });

  it('deduplicates /users/me across full-session consumers', async () => {
    let requests = 0;
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.USERS.ME}`, () => {
        requests += 1;
        return HttpResponse.json({
          user: {
            id: '00000000-0000-4000-8000-000000000001',
            email: 'dedupe@gigsecure.com',
            first_name: 'Dedupe',
            last_name: 'User',
            status: 'active',
            role: 'user',
            email_verified: true,
          },
          profile: null,
          kyc_verified: true,
          risk_assessed: false,
        });
      }),
    );
    act(() => setFullSession());
    const Wrapper = createWrapper();
    const first = renderHook(() => useCurrentUser(), { wrapper: Wrapper });
    const second = renderHook(() => useUserProfile(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(first.result.current.isSuccess).toBe(true);
      expect(second.result.current.isSuccess).toBe(true);
    });

    expect(requests).toBe(1);
  });

  it('honors route-owned profile disablement in a full session', () => {
    act(() => setFullSession());
    const getMeSpy = vi.spyOn(userService, 'getMe');
    const { result } = renderHook(() => useCurrentUser({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getMeSpy).not.toHaveBeenCalled();
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

  return Wrapper;
}

function setFullSession() {
  useAuthStore.getState().setSession({
    accessToken: 'opaque-full-session-token',
    kycVerified: false,
    riskAssessed: false,
  });
}
