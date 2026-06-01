import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKycStatus, useVerifyKyc } from '@/hooks/kyc/useKyc';
import { server } from '@/mocks/server';
import { kycService } from '@/services/kyc.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const validPayload = {
  document_type: 'NIN' as const,
  document_number: '12345678901',
  first_name: 'Amaka',
  last_name: 'Obi',
  date_of_birth: '1995-06-15',
};

beforeEach(() => {
  vi.restoreAllMocks();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('KYC hooks', () => {
  it('updates kycVerified only after a verified response', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    const { result } = renderHook(() => useVerifyKyc(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync(validPayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.status).toBe('verified');
    expect(useAuthStore.getState().kycVerified).toBe(true);
    expect(useAuthStore.getState().riskAssessed).toBe(true);
  });

  it('does not change kycVerified after rejected or failed responses', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    const { result } = renderHook(() => useVerifyKyc(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ ...validPayload, document_number: '11111111111' });
    });

    await waitFor(() => {
      expect(result.current.data?.status).toBe('rejected');
    });
    expect(useAuthStore.getState().kycVerified).toBe(false);

    await act(async () => {
      await result.current.mutateAsync({ ...validPayload, document_number: '22222222222' });
    });

    await waitFor(() => {
      expect(result.current.data?.status).toBe('failed');
    });
    expect(useAuthStore.getState().kycVerified).toBe(false);
  });

  it('exposes parsed verification API errors', async () => {
    const { result } = renderHook(() => useVerifyKyc(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ ...validPayload, document_number: '123' });
      })
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.parsedError?.message).toBe(
      'Document number must be exactly 11 digits.'
    );
    expect(result.current.parsedError?.fieldErrors.document_number).toEqual([
      'Document number must be exactly 11 digits.',
    ]);
  });

  it('does not retry KYC verification mutations through React Query', async () => {
    const verifySpy = vi
      .spyOn(kycService, 'verify')
      .mockRejectedValueOnce(new Error('verification unavailable'));
    const { result } = renderHook(() => useVerifyKyc(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.mutateAsync(validPayload);
      })
    ).rejects.toThrow('verification unavailable');

    expect(verifySpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(result.current.parsedError?.message).toBe('verification unavailable');
    });
  });

  it('loads KYC status query states', async () => {
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

    const { result } = renderHook(() => useKycStatus(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.status).toBe('pending');
    expect(result.current.parsedError).toBeNull();
  });

  it('exposes parsed status query errors', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/kyc/status`, () =>
        HttpResponse.json({ detail: 'Unable to load KYC status.' }, { status: 400 })
      )
    );

    const { result } = renderHook(() => useKycStatus(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.parsedError?.message).toBe('Unable to load KYC status.');
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
