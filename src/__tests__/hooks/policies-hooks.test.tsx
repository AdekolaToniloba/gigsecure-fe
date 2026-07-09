import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  usePoliciesList,
  usePolicyDetail,
  usePolicyReportDownload,
  usePolicySummary,
} from '@/hooks/policies/usePolicies';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { QUERY_KEYS } from '@/lib/constants';
import { policyFixtures } from '@/mocks/fixtures/policies';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const policiesUrl = `${baseUrl}${ENDPOINTS.POLICIES.LIST}`;

beforeEach(() => {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'policy-hook-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
});

describe('policy hooks', () => {
  it('loads summary and caches it under the canonical key', async () => {
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => usePolicySummary(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total_coverage: '690000',
      active_count: 2,
      due_soon_count: 1,
    });
    expect(queryClient.getQueryData(QUERY_KEYS.POLICIES_SUMMARY)).toEqual(result.current.data);
  });

  it('includes the selected status filter in the query key and request params', async () => {
    const seenFilters: Array<string | null> = [];
    server.use(
      http.get(policiesUrl, ({ request }) => {
        seenFilters.push(new URL(request.url).searchParams.get('status_filter'));
        return HttpResponse.json({
          items: policyFixtures.filter((policy) => policy.status === 'expired'),
        });
      })
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => usePoliciesList('expired'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(seenFilters).toEqual(['expired']);
    expect(queryClient.getQueryData(QUERY_KEYS.POLICIES_LIST('expired'))).toMatchObject({
      items: [expect.objectContaining({ status: 'expired' })],
    });
  });

  it('keeps detail queries disabled until a policy ID exists', async () => {
    let detailRequests = 0;
    server.use(
      http.get(`${policiesUrl}/:id`, () => {
        detailRequests += 1;
        return HttpResponse.json(policyFixtures[0]);
      })
    );

    const { Wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ id }) => usePolicyDetail(id),
      { wrapper: Wrapper, initialProps: { id: null as string | null } },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(detailRequests).toBe(0);

    rerender({ id: 'pol-income-active' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(detailRequests).toBe(1);
    expect(result.current.data?.id).toBe('pol-income-active');
  });

  it('keeps query errors representable and retryable in-page', async () => {
    let requests = 0;
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.POLICIES.SUMMARY}`, () => {
        requests += 1;
        return HttpResponse.json({ detail: 'Summary unavailable.' }, { status: 403 });
      })
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePolicySummary(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(requests).toBe(1);
    expect(result.current.refetch).toEqual(expect.any(Function));
  });

  it('exposes report mutation loading, success, and error states without caching server state', async () => {
    server.use(
      http.get(`${policiesUrl}/:id/report`, async ({ request, params }) => {
        if (!request.headers.get('authorization')) {
          return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
        }
        await delay(80);
        return new HttpResponse(`%PDF-1.4\n${String(params.id)}\n%%EOF`, {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        });
      })
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => usePolicyReportDownload(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate('pol-income-active');
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.filename).toBe('gigsecure-policy-pol-income-active-report.pdf');
    expect(queryClient.getQueryData(QUERY_KEYS.POLICY_REPORT('pol-income-active'))).toBeUndefined();

    server.use(
      http.get(`${policiesUrl}/:id/report`, () =>
        HttpResponse.json({ detail: 'Policy report is unavailable.' }, { status: 400 })
      )
    );
    act(() => {
      result.current.reset();
      result.current.mutate('pol-income-active');
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ response: { status: 400 } });
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
