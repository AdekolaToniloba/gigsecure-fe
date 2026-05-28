import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import { useCurrentUser, useUpdateProfile } from '@/hooks/user/useUser';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';

beforeEach(() => {
  vi.restoreAllMocks();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('user profile hooks', () => {
  it('hydrates the authenticated user profile and syncs flags into the auth store', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken(createJwt({ scope: 'authenticated' }));
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

  it('skips /users/me for waitlist-scoped tokens', async () => {
    const getMeSpy = vi.spyOn(userService, 'getMe');
    act(() => {
      useAuthStore.getState().setAccessToken(createJwt({ scope: 'waitlist' }));
    });

    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(getMeSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().kycVerified).toBeNull();
    expect(useAuthStore.getState().riskAssessed).toBeNull();
  });

  it('exposes resolved and loading flag state without raw store imports', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken(createJwt({ scope: 'authenticated' }));
    });

    const { result } = renderHook(() => useUserFlags());

    expect(result.current.hasResolvedFlags).toBe(false);
    expect(result.current.isLoading).toBe(true);

    act(() => {
      useAuthStore.getState().setFlags({ kycVerified: true, riskAssessed: false });
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
      useAuthStore.getState().setAccessToken(createJwt({ scope: 'authenticated' }));
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

function createJwt(payload: Record<string, unknown>) {
  return ['header', encodeBase64Url(JSON.stringify(payload)), 'signature'].join('.');
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
