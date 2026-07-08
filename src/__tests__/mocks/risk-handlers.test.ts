import { describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { parseApiError } from '@/lib/api/errors';
import { waitlistSignupResponseSchema } from '@/lib/validators/auth';
import { recommendedProductsResponseSchema } from '@/lib/validators/marketplace';
import {
  assessmentSummarySchema,
  riskAssessmentResponseSchema,
  riskCategoriesResponseSchema,
  riskQuestionsResponseSchema,
  riskRecommendationsResponseSchema,
  techAssessmentInputSchema,
} from '@/lib/validators/risk';
import {
  assessmentHistoryFixture,
  assessmentPayloadFixture,
  dashboardAssessmentResponseFixture,
  emptyAssessmentResponseFixture,
  emptyRiskRecommendationsFixture,
  FULL_SESSION_RISK_ACCESS_TOKEN,
  malformedRiskFixtures,
  publicAssessmentResponseFixture,
  riskCategoriesFixture,
  riskErrorFixtures,
  riskQuestionsFixture,
  riskRecommendationsFixture,
  WAITLIST_RISK_ACCESS_TOKEN,
  waitlistSignupFixture,
} from '@/mocks/fixtures/risk-assessment';
import { handlers } from '@/mocks/handlers';
import {
  WAITLIST_LOADING_DELAY_MS,
  waitlistHandlerScenarios,
} from '@/mocks/handlers/auth';
import { domainHandlers } from '@/mocks/handlers/domain';
import {
  MARKETPLACE_RECOMMENDATIONS_DELAY_MS,
  marketplaceRecommendationHandlerScenarios,
} from '@/mocks/handlers/marketplace';
import {
  RISK_LOADING_DELAY_MS,
  riskHandlers,
  riskHandlerScenarios,
} from '@/mocks/handlers/risk';
import { server } from '@/mocks/server';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const urls = {
  categories: `${baseUrl}${ENDPOINTS.RISK.CATEGORIES}`,
  questions: `${baseUrl}${ENDPOINTS.RISK.QUESTIONS}?category=tech_freelancer`,
  submission: `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('tech_freelancer')}`,
  latest: `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`,
  history: `${baseUrl}${ENDPOINTS.RISK.HISTORY}`,
  recommendations: `${baseUrl}${ENDPOINTS.RISK.RECOMMENDATIONS}`,
  marketplaceRecommendations: `${baseUrl}${ENDPOINTS.MARKETPLACE.RECOMMENDATIONS}`,
} as const;

function withBearer(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function responseJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('risk-assessment contract fixtures', () => {
  it('keeps all success and empty-state fixtures inside their runtime contracts', () => {
    expect(waitlistSignupResponseSchema.parse(waitlistSignupFixture)).toEqual(waitlistSignupFixture);
    expect(riskCategoriesResponseSchema.parse(riskCategoriesFixture)).toEqual(riskCategoriesFixture);
    expect(riskQuestionsResponseSchema.parse(riskQuestionsFixture)).toEqual(riskQuestionsFixture);
    expect(techAssessmentInputSchema.parse(assessmentPayloadFixture)).toEqual(
      assessmentPayloadFixture
    );
    expect(riskAssessmentResponseSchema.parse(publicAssessmentResponseFixture)).toEqual(
      publicAssessmentResponseFixture
    );
    expect(riskAssessmentResponseSchema.parse(dashboardAssessmentResponseFixture)).toEqual(
      dashboardAssessmentResponseFixture
    );
    expect(riskAssessmentResponseSchema.parse(emptyAssessmentResponseFixture)).toEqual(
      emptyAssessmentResponseFixture
    );
    expect(assessmentSummarySchema.array().parse(assessmentHistoryFixture)).toEqual(
      assessmentHistoryFixture
    );
    expect(riskRecommendationsResponseSchema.parse(riskRecommendationsFixture)).toEqual(
      riskRecommendationsFixture
    );
    expect(riskRecommendationsResponseSchema.parse(emptyRiskRecommendationsFixture)).toEqual(
      emptyRiskRecommendationsFixture
    );
    expect(riskQuestionsFixture.title.length).toBeGreaterThan(45);
  });

  it('keeps malformed fixtures outside the corresponding runtime contracts', () => {
    expect(riskCategoriesResponseSchema.safeParse(malformedRiskFixtures.categories).success).toBe(
      false
    );
    expect(riskQuestionsResponseSchema.safeParse(malformedRiskFixtures.questions).success).toBe(
      false
    );
    expect(riskAssessmentResponseSchema.safeParse(malformedRiskFixtures.assessment).success).toBe(
      false
    );
    expect(assessmentSummarySchema.array().safeParse(malformedRiskFixtures.history).success).toBe(
      false
    );
    expect(
      riskRecommendationsResponseSchema.safeParse(malformedRiskFixtures.recommendations).success
    ).toBe(false);
  });
});

describe('waitlist-issued Bearer handoff', () => {
  it('returns the assessment Bearer token without full-session flags', async () => {
    const response = await fetch('/api/auth/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'oluwakanyinsola@example.com',
        first_name: 'Oluwakanyinsola',
        last_name: 'Adebayo-Akinyemi',
      }),
    });
    const body = await responseJson(response);

    expect(response.status).toBe(200);
    expect(waitlistSignupResponseSchema.parse(body)).toEqual(waitlistSignupFixture);
    expect(body).not.toHaveProperty('refresh_token');
    expect(body).not.toHaveProperty('risk_assessed');
    expect(body).not.toHaveProperty('kyc_verified');
  });

  it('provides deterministic validation, failure, and delayed states', async () => {
    const invalid = await fetch('/api/auth/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', first_name: '' }),
    });
    expect(invalid.status).toBe(422);

    server.use(waitlistHandlerScenarios.failure);
    const failed = await fetch('/api/auth/waitlist', { method: 'POST' });
    expect(failed.status).toBe(500);

    server.use(waitlistHandlerScenarios.delayed);
    const startedAt = performance.now();
    const delayed = await fetch('/api/auth/waitlist', { method: 'POST' });
    expect(delayed.status).toBe(200);
    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(WAITLIST_LOADING_DELAY_MS - 20);
  });
});

describe('shared-Bearer risk handlers', () => {
  it.each([WAITLIST_RISK_ACCESS_TOKEN, FULL_SESSION_RISK_ACCESS_TOKEN])(
    'accepts %s unchanged for every risk read endpoint',
    async (token) => {
      const requests = [
        [urls.categories, riskCategoriesResponseSchema],
        [urls.questions, riskQuestionsResponseSchema],
        [urls.latest, riskAssessmentResponseSchema],
        [urls.history, assessmentSummarySchema.array()],
        [urls.recommendations, riskRecommendationsResponseSchema],
      ] as const;

      for (const [url, schema] of requests) {
        const response = await fetch(url, withBearer(token));
        expect(response.status).toBe(200);
        expect(schema.safeParse(await responseJson(response)).success).toBe(true);
      }
    }
  );

  it('rejects missing Bearer authentication and models backend token expiry separately', async () => {
    for (const url of [
      urls.categories,
      urls.questions,
      urls.latest,
      urls.history,
      urls.recommendations,
    ]) {
      const response = await fetch(url);
      expect(response.status).toBe(401);
      await expect(responseJson(response)).resolves.toEqual(riskErrorFixtures.unauthorized);
    }

    server.use(riskHandlerScenarios.questions.backendUnauthorized);
    const expired = await fetch(urls.questions, withBearer(WAITLIST_RISK_ACCESS_TOKEN));
    expect(expired.status).toBe(401);
    await expect(responseJson(expired)).resolves.toEqual(riskErrorFixtures.expired);
  });

  it('provides valid, malformed, error, and delayed category states', async () => {
    server.use(riskHandlerScenarios.categories.malformed);
    const malformed = await fetch(urls.categories, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    expect(
      riskCategoriesResponseSchema.safeParse(await responseJson(malformed)).success
    ).toBe(false);

    server.use(riskHandlerScenarios.categories.failure);
    const failed = await fetch(urls.categories, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    expect(failed.status).toBe(500);

    server.use(riskHandlerScenarios.categories.delayed);
    const startedAt = performance.now();
    const delayed = await fetch(urls.categories, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    expect(delayed.status).toBe(200);
    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(RISK_LOADING_DELAY_MS - 20);
  });

  it('provides valid, malformed, error, delayed, and unsupported question states', async () => {
    server.use(riskHandlerScenarios.questions.malformed);
    const malformed = await fetch(urls.questions, withBearer(WAITLIST_RISK_ACCESS_TOKEN));
    expect(riskQuestionsResponseSchema.safeParse(await responseJson(malformed)).success).toBe(false);

    server.use(riskHandlerScenarios.questions.failure);
    const failed = await fetch(urls.questions, withBearer(WAITLIST_RISK_ACCESS_TOKEN));
    expect(failed.status).toBe(500);

    server.use(riskHandlerScenarios.questions.delayed);
    const startedAt = performance.now();
    const delayed = await fetch(urls.questions, withBearer(WAITLIST_RISK_ACCESS_TOKEN));
    expect(delayed.status).toBe(200);
    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(RISK_LOADING_DELAY_MS - 20);

    server.use(riskHandlerScenarios.questions.valid);
    const unsupported = await fetch(
      `${baseUrl}${ENDPOINTS.RISK.QUESTIONS}?category=unknown_category`,
      withBearer(WAITLIST_RISK_ACCESS_TOKEN)
    );
    expect(unsupported.status).toBe(422);
  });
});

describe('dynamic risk submission contract', () => {
  it('rejects public submission when no waitlist-issued Bearer token is present', async () => {
    const response = await fetch(urls.submission, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessmentPayloadFixture),
    });

    expect(response.status).toBe(401);
    await expect(responseJson(response)).resolves.toEqual(riskErrorFixtures.unauthorized);
  });

  it('returns the public 201 response for a waitlist-issued Bearer token', async () => {
    const response = await fetch(urls.submission, {
      ...withBearer(WAITLIST_RISK_ACCESS_TOKEN),
      method: 'POST',
      headers: {
        ...withBearer(WAITLIST_RISK_ACCESS_TOKEN).headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentPayloadFixture),
    });

    expect(response.status).toBe(201);
    expect(riskAssessmentResponseSchema.parse(await responseJson(response))).toEqual(
      publicAssessmentResponseFixture
    );
  });

  it('returns the dashboard 201 response for a full-session Bearer token', async () => {
    server.use(riskHandlerScenarios.submission.dashboardSuccess);
    const response = await fetch(urls.submission, {
      ...withBearer(FULL_SESSION_RISK_ACCESS_TOKEN),
      method: 'POST',
      headers: {
        ...withBearer(FULL_SESSION_RISK_ACCESS_TOKEN).headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentPayloadFixture),
    });

    expect(response.status).toBe(201);
    expect(await responseJson(response)).toEqual(dashboardAssessmentResponseFixture);
  });

  it('requires the dynamic path category to equal the validated body occupation', async () => {
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('creative_freelancer')}`,
      {
        ...withBearer(WAITLIST_RISK_ACCESS_TOKEN),
        method: 'POST',
        headers: {
          ...withBearer(WAITLIST_RISK_ACCESS_TOKEN).headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentPayloadFixture),
      }
    );
    const body = await responseJson(response);

    expect(response.status).toBe(422);
    expect(
      parseApiError({ response: { status: response.status, data: body } })
    ).toMatchObject({
      statusCode: 422,
      fieldErrors: {
        occupation: ['Assessment category must match the request path'],
      },
    });
  });

  it.each([
    ['unauthorized', 401],
    ['validationFailure', 422],
    ['failure', 500],
  ] as const)('provides the %s submission state', async (scenario, expectedStatus) => {
    server.use(riskHandlerScenarios.submission[scenario]);
    const response = await fetch(urls.submission, {
      ...withBearer(FULL_SESSION_RISK_ACCESS_TOKEN),
      method: 'POST',
      headers: {
        ...withBearer(FULL_SESSION_RISK_ACCESS_TOKEN).headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentPayloadFixture),
    });
    expect(response.status).toBe(expectedStatus);
  });
});

describe('report and recommendation network states', () => {
  it('provides latest empty/not-found/malformed and history empty/malformed outcomes', async () => {
    server.use(riskHandlerScenarios.latest.notFound);
    expect((await fetch(urls.latest, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN))).status).toBe(404);

    server.use(riskHandlerScenarios.latest.malformed);
    const malformedLatest = await fetch(urls.latest, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    expect(
      riskAssessmentResponseSchema.safeParse(await responseJson(malformedLatest)).success
    ).toBe(false);

    server.use(riskHandlerScenarios.history.empty);
    const emptyHistory = await fetch(urls.history, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    await expect(responseJson(emptyHistory)).resolves.toEqual([]);

    server.use(riskHandlerScenarios.history.malformed);
    const malformedHistory = await fetch(urls.history, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    expect(
      assessmentSummarySchema.array().safeParse(await responseJson(malformedHistory)).success
    ).toBe(false);
  });

  it('provides textual recommendation empty, malformed, and failure outcomes', async () => {
    server.use(riskHandlerScenarios.recommendations.empty);
    const empty = await fetch(urls.recommendations, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    expect(riskRecommendationsResponseSchema.parse(await responseJson(empty))).toEqual(
      emptyRiskRecommendationsFixture
    );

    server.use(riskHandlerScenarios.recommendations.malformed);
    const malformed = await fetch(urls.recommendations, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN));
    expect(
      riskRecommendationsResponseSchema.safeParse(await responseJson(malformed)).success
    ).toBe(false);

    server.use(riskHandlerScenarios.recommendations.failure);
    expect(
      (await fetch(urls.recommendations, withBearer(FULL_SESSION_RISK_ACCESS_TOKEN))).status
    ).toBe(500);
  });
});

describe('authenticated marketplace recommendation scenarios', () => {
  it('requires a Bearer token and serves contract-valid success and empty outcomes', async () => {
    expect((await fetch(urls.marketplaceRecommendations)).status).toBe(401);

    const success = await fetch(
      urls.marketplaceRecommendations,
      withBearer(FULL_SESSION_RISK_ACCESS_TOKEN)
    );
    expect(
      recommendedProductsResponseSchema.safeParse(await responseJson(success)).success
    ).toBe(true);

    server.use(marketplaceRecommendationHandlerScenarios.empty);
    const empty = await fetch(
      urls.marketplaceRecommendations,
      withBearer(FULL_SESSION_RISK_ACCESS_TOKEN)
    );
    expect(recommendedProductsResponseSchema.parse(await responseJson(empty))).toEqual({
      recommended_categories: [],
      items: [],
    });
  });

  it('provides malformed, error, and delayed recommendation outcomes', async () => {
    server.use(marketplaceRecommendationHandlerScenarios.malformed);
    const malformed = await fetch(
      urls.marketplaceRecommendations,
      withBearer(FULL_SESSION_RISK_ACCESS_TOKEN)
    );
    expect(
      recommendedProductsResponseSchema.safeParse(await responseJson(malformed)).success
    ).toBe(false);

    server.use(marketplaceRecommendationHandlerScenarios.failure);
    expect(
      (
        await fetch(
          urls.marketplaceRecommendations,
          withBearer(FULL_SESSION_RISK_ACCESS_TOKEN)
        )
      ).status
    ).toBe(500);

    server.use(marketplaceRecommendationHandlerScenarios.delayed);
    const startedAt = performance.now();
    const delayed = await fetch(
      urls.marketplaceRecommendations,
      withBearer(FULL_SESSION_RISK_ACCESS_TOKEN)
    );
    expect(delayed.status).toBe(200);
    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(
      MARKETPLACE_RECOMMENDATIONS_DELAY_MS - 20
    );
  });
});

describe('MSW registration', () => {
  it('shares the risk handlers between browser and Node and removes stale domain routes', () => {
    for (const handler of riskHandlers) {
      expect(server.listHandlers()).toContain(handler);
      expect(handlers).toContain(handler);
    }

    expect(riskHandlerScenarios.submission.publicSuccess.info.path).toBe(
      `${baseUrl}/api/v1/risk/assessment/:category`
    );
    expect(
      domainHandlers.every((handler) => !String(handler.info.path).includes('/api/v1/risk/'))
    ).toBe(true);
  });
});
