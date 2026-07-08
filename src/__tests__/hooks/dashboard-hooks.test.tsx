import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DASHBOARD_OVERVIEW_STALE_TIME,
  useDashboardOverview,
} from '@/hooks/dashboard/useDashboard';
import { useLatestAssessment } from '@/hooks/risk/useRisk';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { QUERY_KEYS } from '@/lib/constants';
import {
  dashboardProfileFixtures,
  latestAssessmentFixture,
  unassessedDashboardOverview,
} from '@/mocks/fixtures/dashboard';
import { dashboardHandlerScenarios } from '@/mocks/handlers/dashboard';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const overviewUrl = `${baseUrl}${ENDPOINTS.DASHBOARD.OVERVIEW}`;

beforeEach(() => {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'dashboard-hook-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
});

describe('dashboard hooks', () => {
  it('exposes loading, success, refetch, and the intentional cache policy', async () => {
    server.use(dashboardHandlerScenarios.delayed);
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useDashboardOverview(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.refetch).toEqual(expect.any(Function));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(unassessedDashboardOverview);
    expect(queryClient.getQueryData(QUERY_KEYS.DASHBOARD_OVERVIEW)).toEqual(
      unassessedDashboardOverview
    );
    expect(queryClient.getQueryState(QUERY_KEYS.DASHBOARD_OVERVIEW)?.dataUpdatedAt)
      .toBeGreaterThan(0);
    expect(DASHBOARD_OVERVIEW_STALE_TIME).toBe(120_000);
  });

  it('deduplicates overview, profile, and assessment consumers without a request waterfall', async () => {
    let overviewRequests = 0;
    let profileRequests = 0;
    let assessmentRequests = 0;
    let completedRequests = 0;

    server.use(
      http.get(overviewUrl, async () => {
        overviewRequests += 1;
        await delay(120);
        completedRequests += 1;
        return HttpResponse.json(unassessedDashboardOverview);
      }),
      http.get(`${baseUrl}${ENDPOINTS.USERS.ME}`, async () => {
        profileRequests += 1;
        await delay(120);
        completedRequests += 1;
        return HttpResponse.json(dashboardProfileFixtures.unassessedKycVerified);
      }),
      http.get(`${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`, async () => {
        assessmentRequests += 1;
        await delay(120);
        completedRequests += 1;
        return HttpResponse.json(latestAssessmentFixture);
      })
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => ({
      overviewOne: useDashboardOverview(),
      overviewTwo: useDashboardOverview(),
      profileOne: useUserProfile(),
      profileTwo: useUserProfile(),
      assessmentOne: useLatestAssessment(),
      assessmentTwo: useLatestAssessment(),
    }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(overviewRequests).toBe(1);
      expect(profileRequests).toBe(1);
      expect(assessmentRequests).toBe(1);
    });
    expect(completedRequests).toBe(0);

    await waitFor(() => {
      expect(result.current.overviewOne.isSuccess).toBe(true);
      expect(result.current.profileOne.isSuccess).toBe(true);
      expect(result.current.assessmentOne.isSuccess).toBe(true);
    });
    expect(completedRequests).toBe(3);

    expect(result.current.overviewTwo.data).toBe(result.current.overviewOne.data);
    expect(result.current.profileTwo.data).toBe(result.current.profileOne.data);
    expect(result.current.assessmentTwo.data).toBe(result.current.assessmentOne.data);
  });

  it('keeps a 4xx query error representable and does not retry it', async () => {
    let requests = 0;
    server.use(
      http.get(overviewUrl, () => {
        requests += 1;
        return HttpResponse.json({ detail: 'Dashboard access is unavailable.' }, { status: 403 });
      })
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardOverview(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(requests).toBe(1);
    expect(result.current.error).toMatchObject({ response: { status: 403 } });
    expect(result.current.refetch).toEqual(expect.any(Function));
  });

  it('can remain idle until its authenticated controller enables it', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useDashboardOverview({ enabled: false }),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
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
