import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  assessmentHistoryFixture,
  latestAssessmentFixture,
} from '@/mocks/fixtures/dashboard';
import {
  assessmentPayloadFixture,
  FULL_SESSION_RISK_ACCESS_TOKEN,
  publicAssessmentResponseFixture,
  riskCategoriesFixture,
  riskQuestionsFixture,
  riskRecommendationsFixture,
  WAITLIST_RISK_ACCESS_TOKEN,
} from '@/mocks/fixtures/risk-assessment';
import { riskHandlerScenarios } from '@/mocks/handlers/risk';
import { server } from '@/mocks/server';
import { riskService } from '@/services/risk.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

beforeEach(() => {
  useAuthStore.getState().setSession({
    accessToken: FULL_SESSION_RISK_ACCESS_TOKEN,
    kycVerified: true,
    riskAssessed: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('riskService', () => {
  it.each([WAITLIST_RISK_ACCESS_TOKEN, FULL_SESSION_RISK_ACCESS_TOKEN])(
    'uses the same authenticated risk methods for token %s',
    async (accessToken) => {
      useAuthStore.getState().setAccessToken(accessToken);

      await expect(riskService.getCategories()).resolves.toEqual(riskCategoriesFixture);
      await expect(riskService.getQuestions('tech_freelancer')).resolves.toEqual(
        riskQuestionsFixture,
      );
      await expect(riskService.getLatestAssessment()).resolves.toEqual(
        latestAssessmentFixture,
      );
      await expect(riskService.getHistory()).resolves.toEqual(assessmentHistoryFixture);
      await expect(riskService.getRecommendations()).resolves.toEqual(
        riskRecommendationsFixture,
      );
      await expect(
        riskService.submitAssessment('tech_freelancer', assessmentPayloadFixture),
      ).resolves.toEqual(publicAssessmentResponseFixture);
    },
  );

  it('rejects malformed category and question responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      riskHandlerScenarios.categories.malformed,
      riskHandlerScenarios.questions.malformed,
    );

    await expect(riskService.getCategories()).rejects.toThrow(
      'Invalid API response shape in riskService.getCategories',
    );
    await expect(riskService.getQuestions('tech_freelancer')).rejects.toThrow(
      'Invalid API response shape in riskService.getQuestions',
    );
  });

  it('passes AbortSignal through cancellable risk requests', async () => {
    server.use(riskHandlerScenarios.questions.delayed);
    const controller = new AbortController();
    const request = riskService.getQuestions('tech_freelancer', controller.signal);

    controller.abort();

    await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });

  it('loads and validates the latest assessment through the authenticated client', async () => {
    expect.assertions(2);
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`, ({ request }) => {
        expect(request.headers.get('authorization')).toBe(
          `Bearer ${FULL_SESSION_RISK_ACCESS_TOKEN}`,
        );
        return HttpResponse.json(latestAssessmentFixture);
      })
    );

    await expect(riskService.getLatestAssessment()).resolves.toEqual(latestAssessmentFixture);
  });

  it('rejects malformed latest-assessment responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`, () =>
        HttpResponse.json({ ...latestAssessmentFixture, overall_score: 101 })
      )
    );

    await expect(riskService.getLatestAssessment()).rejects.toThrow(
      'Invalid API response shape in riskService.getLatestAssessment'
    );
  });

  it('submits the generated payload to the documented category endpoint and validates output', async () => {
    expect.assertions(4);
    const payload = assessmentPayloadFixture;
    const controller = new AbortController();

    server.use(
      http.post(
        `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('tech_freelancer')}`,
        async ({ request }) => {
          expect(request.headers.get('authorization')).toBe(
            `Bearer ${FULL_SESSION_RISK_ACCESS_TOKEN}`,
          );
          expect(request.signal.aborted).toBe(false);
          expect(await request.json()).toEqual(payload);
          return HttpResponse.json(latestAssessmentFixture, { status: 201 });
        }
      )
    );

    await expect(
      riskService.submitAssessment('tech_freelancer', payload, controller.signal),
    ).resolves.toEqual(latestAssessmentFixture);
  });

  it('uses a dynamic category and requires it to match the exact payload occupation', async () => {
    let requests = 0;
    const payload = { ...assessmentPayloadFixture, occupation: 'creative_freelancer' };
    server.use(
      http.post(
        `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('creative_freelancer')}`,
        async ({ request }) => {
          requests += 1;
          expect(await request.json()).toEqual(payload);
          return HttpResponse.json(latestAssessmentFixture, { status: 201 });
        },
      ),
    );

    await expect(
      riskService.submitAssessment('creative_freelancer', payload),
    ).resolves.toEqual(latestAssessmentFixture);
    await expect(
      riskService.submitAssessment('tech_freelancer', payload),
    ).rejects.toThrow('Assessment category must match payload occupation');
    expect(requests).toBe(1);
  });

  it('requires the documented 201 submission status', async () => {
    server.use(
      http.post(
        `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('tech_freelancer')}`,
        () => HttpResponse.json(latestAssessmentFixture, { status: 200 }),
      ),
    );

    await expect(
      riskService.submitAssessment('tech_freelancer', assessmentPayloadFixture),
    ).rejects.toThrow('Invalid API response status in riskService.submitAssessment');
  });

  it('rejects malformed category-submission responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.post(
        `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('tech_freelancer')}`,
        () => HttpResponse.json({ ...latestAssessmentFixture, pillar_scores: null }, { status: 201 })
      )
    );

    await expect(
      riskService.submitAssessment('tech_freelancer', assessmentPayloadFixture),
    ).rejects.toThrow(
      'Invalid API response shape in riskService.submitAssessment'
    );
  });

  it('loads documented assessment summaries and rejects malformed history', async () => {
    await expect(riskService.getHistory()).resolves.toEqual(assessmentHistoryFixture);

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.HISTORY}`, () =>
        HttpResponse.json([{ ...assessmentHistoryFixture[0], overall_score: -1 }])
      )
    );

    await expect(riskService.getHistory()).rejects.toThrow(
      'Invalid API response shape in riskService.getHistory'
    );
  });

  it('loads textual risk recommendations and rejects the removed product-array shape', async () => {
    await expect(riskService.getRecommendations()).resolves.toEqual(
      riskRecommendationsFixture
    );

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.RECOMMENDATIONS}`, () =>
        HttpResponse.json([{ product_id: 'product-1', reason: 'Stale product shape' }])
      )
    );

    await expect(riskService.getRecommendations()).rejects.toThrow(
      'Invalid API response shape in riskService.getRecommendations'
    );
  });
});
