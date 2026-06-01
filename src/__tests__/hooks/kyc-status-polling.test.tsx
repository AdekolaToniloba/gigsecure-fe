import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  KYC_PENDING_FAST_POLL_MS,
  KYC_PENDING_MAX_POLL_COUNT,
  KYC_PENDING_SLOW_POLL_MS,
  getKycStatusRefetchInterval,
  usePollingKycStatus,
} from '@/hooks/kyc/useKyc';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('KYC status polling policy', () => {
  it('polls every 3 seconds for the first 10 pending polls', () => {
    expect(getKycStatusRefetchInterval('pending', 0)).toBe(KYC_PENDING_FAST_POLL_MS);
    expect(getKycStatusRefetchInterval('pending', 9)).toBe(KYC_PENDING_FAST_POLL_MS);
  });

  it('backs off to 10 seconds after the first 10 pending polls', () => {
    expect(getKycStatusRefetchInterval('pending', 10)).toBe(KYC_PENDING_SLOW_POLL_MS);
    expect(getKycStatusRefetchInterval('pending', 36)).toBe(KYC_PENDING_SLOW_POLL_MS);
  });

  it('stops polling after the 5-minute pending window and for terminal states', () => {
    expect(getKycStatusRefetchInterval('pending', KYC_PENDING_MAX_POLL_COUNT)).toBe(false);
    expect(getKycStatusRefetchInterval('verified', 0)).toBe(false);
    expect(getKycStatusRefetchInterval('rejected', 0)).toBe(false);
    expect(getKycStatusRefetchInterval('failed', 0)).toBe(false);
    expect(getKycStatusRefetchInterval(null, 0)).toBe(false);
  });
});

describe('usePollingKycStatus', () => {
  it('tracks pending poll count for pending statuses', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/kyc/status`, () =>
        HttpResponse.json({
          status: 'pending',
          document_type: 'NIN',
          verified_at: null,
          rejection_reason: null,
        })
      )
    );

    const { result } = renderHook(() => usePollingKycStatus(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data?.status).toBe('pending');
      expect(result.current.pendingPollCount).toBe(1);
    });
  });

  it('updates the store flag when status transitions to verified', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/kyc/status`, () =>
        HttpResponse.json({
          status: 'verified',
          document_type: 'NIN',
          verified_at: '2026-04-24T10:00:00Z',
          rejection_reason: null,
        })
      )
    );
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    const { result } = renderHook(() => usePollingKycStatus(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data?.status).toBe('verified');
      expect(useAuthStore.getState().kycVerified).toBe(true);
    });
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
