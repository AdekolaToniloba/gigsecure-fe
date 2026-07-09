import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LATEST_ASSESSMENT_STALE_TIME,
  useRiskCategories,
  useRiskQuestions,
  useLatestAssessment,
  useSubmitTechAssessment,
} from '@/hooks/risk/useRisk';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { latestAssessmentFixture } from '@/mocks/fixtures/dashboard';
import {
  assessmentPayloadFixture,
  FULL_SESSION_RISK_ACCESS_TOKEN,
  riskCategoriesFixture,
  WAITLIST_RISK_ACCESS_TOKEN,
} from '@/mocks/fixtures/risk-assessment';
import { server } from '@/mocks/server';
import { riskService } from '@/services/risk.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const assessmentUrl = `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`;

describe('risk hooks', () => {
  beforeEach(() => {
    useAuthStore.getState().setAccessToken(FULL_SESSION_RISK_ACCESS_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(result.current.parsedError?.message).toBe(
      'Invalid API response shape in riskService.getLatestAssessment',
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
    expect(result.current.parsedError).toMatchObject({
      message: 'Assessment not found.',
      statusCode: 404,
    });
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

  it('does not enable risk queries without an in-memory access token', () => {
    useAuthStore.getState().clearAuth();
    const categoriesSpy = vi.spyOn(riskService, 'getCategories');
    const questionsSpy = vi.spyOn(riskService, 'getQuestions');
    const { Wrapper } = createWrapper();

    const categories = renderHook(() => useRiskCategories(), { wrapper: Wrapper });
    const questions = renderHook(() => useRiskQuestions('tech_freelancer'), {
      wrapper: Wrapper,
    });

    expect(categories.result.current.fetchStatus).toBe('idle');
    expect(questions.result.current.fetchStatus).toBe('idle');
    expect(categoriesSpy).not.toHaveBeenCalled();
    expect(questionsSpy).not.toHaveBeenCalled();
  });

  it.each([WAITLIST_RISK_ACCESS_TOKEN, FULL_SESSION_RISK_ACCESS_TOKEN])(
    'enables the same risk query for token %s without inspecting token type',
    async (accessToken) => {
      useAuthStore.getState().setAccessToken(accessToken);
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useRiskCategories(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(riskCategoriesFixture);
    },
  );

  it('deduplicates category requests through the canonical query key', async () => {
    let requests = 0;
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.CATEGORIES}`, () => {
        requests += 1;
        return HttpResponse.json(riskCategoriesFixture);
      }),
    );
    const { Wrapper } = createWrapper();
    const first = renderHook(() => useRiskCategories(), { wrapper: Wrapper });
    const second = renderHook(() => useRiskCategories(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(first.result.current.isSuccess).toBe(true);
      expect(second.result.current.isSuccess).toBe(true);
    });

    expect(requests).toBe(1);
  });

  it('does not retry an expected question 422 response', async () => {
    let requests = 0;
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.QUESTIONS}`, () => {
        requests += 1;
        return HttpResponse.json(
          { detail: [{ loc: ['query', 'category'], msg: 'Unsupported', type: 'value_error' }] },
          { status: 422 },
        );
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRiskQuestions('unsupported'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(requests).toBe(1);
    expect(result.current.parsedError).toMatchObject({
      message: 'Unsupported',
      statusCode: 422,
      fieldErrors: { 'query.category': ['Unsupported'] },
    });
  });

  it('submits a category and exact payload without hook retries or route side effects', async () => {
    const signal = new AbortController().signal;
    const serviceSpy = vi
      .spyOn(riskService, 'submitAssessment')
      .mockResolvedValue(latestAssessmentFixture);
    const clearAuthSpy = vi.spyOn(useAuthStore.getState(), 'clearAuth');
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSubmitTechAssessment(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        category: 'tech_freelancer',
        payload: assessmentPayloadFixture,
        signal,
      });
    });

    expect(serviceSpy).toHaveBeenCalledTimes(1);
    expect(serviceSpy).toHaveBeenCalledWith(
      'tech_freelancer',
      assessmentPayloadFixture,
      signal,
    );
    expect(clearAuthSpy).not.toHaveBeenCalled();
  });

  it('exposes backend authentication errors without clearing auth or redirecting', async () => {
    const authenticationError = {
      response: { status: 401, data: { detail: 'Assessment token expired.' } },
    };
    vi.spyOn(riskService, 'submitAssessment').mockRejectedValue(authenticationError);
    const clearAuthSpy = vi.spyOn(useAuthStore.getState(), 'clearAuth');
    const originalLocation = window.location.href;
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSubmitTechAssessment(), { wrapper: Wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          category: 'tech_freelancer',
          payload: assessmentPayloadFixture,
        }),
      ).rejects.toBe(authenticationError);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.parsedError).toMatchObject({
      message: 'Assessment token expired.',
      statusCode: 401,
    });
    expect(clearAuthSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalLocation);
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
