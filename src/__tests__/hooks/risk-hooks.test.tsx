import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import {
  LATEST_ASSESSMENT_STALE_TIME,
  useLatestAssessment,
} from '@/hooks/risk/useRisk';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { latestAssessmentFixture } from '@/mocks/fixtures/dashboard';
import { server } from '@/mocks/server';
import { riskService } from '@/services/risk.service';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const assessmentUrl = `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`;

describe('risk hooks', () => {
  it('returns the corrected latest assessment through the existing canonical hook', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLatestAssessment(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(latestAssessmentFixture);
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect(LATEST_ASSESSMENT_STALE_TIME).toBe(300_000);
  });

  it('keeps malformed assessment errors in query state', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(assessmentUrl, () =>
        HttpResponse.json({ ...latestAssessmentFixture, overall_score: Number.NaN })
      )
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLatestAssessment(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(
      new Error('Invalid API response shape in riskService.getLatestAssessment')
    );
  });

  it('does not retry expected 4xx assessment failures', async () => {
    let requests = 0;
    server.use(
      http.get(assessmentUrl, () => {
        requests += 1;
        return HttpResponse.json({ detail: 'Assessment not found.' }, { status: 404 });
      })
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLatestAssessment(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(requests).toBe(1);
    expect(result.current.error).toMatchObject({ response: { status: 404 } });
  });

  it('does not request an assessment while disabled', () => {
    const serviceSpy = vi.spyOn(riskService, 'getLatestAssessment');
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useLatestAssessment({ enabled: false }),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(serviceSpy).not.toHaveBeenCalled();
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
