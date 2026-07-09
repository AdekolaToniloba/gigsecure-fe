import { delay, http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { techAssessmentInputSchema } from '@/lib/validators/risk';
import {
  assessmentHistoryFixture,
  dashboardAssessmentResponseFixture,
  emptyRiskRecommendationsFixture,
  malformedRiskFixtures,
  publicAssessmentResponseFixture,
  riskCategoriesFixture,
  riskErrorFixtures,
  riskQuestionsFixture,
  riskRecommendationsFixture,
} from '@/mocks/fixtures/risk-assessment';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const urls = {
  categories: `${BASE}${ENDPOINTS.RISK.CATEGORIES}`,
  questions: `${BASE}${ENDPOINTS.RISK.QUESTIONS}`,
  submission: `${BASE}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY(':category')}`,
  latest: `${BASE}${ENDPOINTS.RISK.ASSESSMENT}`,
  history: `${BASE}${ENDPOINTS.RISK.HISTORY}`,
  recommendations: `${BASE}${ENDPOINTS.RISK.RECOMMENDATIONS}`,
} as const;

export const RISK_LOADING_DELAY_MS = 120;

function hasBearerToken(request: Request): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '');
}

function unauthorizedResponse() {
  return HttpResponse.json(riskErrorFixtures.unauthorized, { status: 401 });
}

function guardedGet(url: string, body: JsonBodyType, status = 200) {
  return http.get(url, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(body, { status });
  });
}

function delayedGet(url: string, body: JsonBodyType) {
  return http.get(url, async ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    await delay(RISK_LOADING_DELAY_MS);
    return HttpResponse.json(body);
  });
}

function backendUnauthorizedGet(url: string) {
  return http.get(url, () =>
    HttpResponse.json(riskErrorFixtures.expired, { status: 401 })
  );
}

function questionsHandler(body: JsonBodyType) {
  return http.get(urls.questions, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();

    const category = new URL(request.url).searchParams.get('category');
    if (category && category !== riskQuestionsFixture.category) {
      return HttpResponse.json(
        {
          detail: [
            {
              loc: ['query', 'category'],
              msg: 'Unsupported assessment category',
              type: 'value_error.category',
            },
          ],
        },
        { status: 422 }
      );
    }

    return HttpResponse.json(body);
  });
}

function submissionHandler(responseBody: JsonBodyType) {
  return http.post(urls.submission, async ({ params, request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(riskErrorFixtures.validation, { status: 422 });
    }

    const parsed = techAssessmentInputSchema.safeParse(body);
    if (!parsed.success || params.category !== parsed.data.occupation) {
      return HttpResponse.json(riskErrorFixtures.validation, { status: 422 });
    }

    return HttpResponse.json(responseBody, { status: 201 });
  });
}

function submissionStatusHandler(body: JsonBodyType, status: 401 | 422 | 500) {
  return http.post(urls.submission, async ({ params, request }) => {
    if (status !== 401 && !hasBearerToken(request)) return unauthorizedResponse();

    if (status === 422) {
      const payload = await request.json().catch(() => null);
      const parsed = techAssessmentInputSchema.safeParse(payload);
      if (!parsed.success || params.category !== parsed.data.occupation) {
        return HttpResponse.json(riskErrorFixtures.validation, { status: 422 });
      }
    }

    return HttpResponse.json(body, { status });
  });
}

export const riskHandlerScenarios = {
  categories: {
    valid: guardedGet(urls.categories, riskCategoriesFixture),
    malformed: guardedGet(urls.categories, malformedRiskFixtures.categories),
    failure: guardedGet(urls.categories, riskErrorFixtures.server, 500),
    delayed: delayedGet(urls.categories, riskCategoriesFixture),
    backendUnauthorized: backendUnauthorizedGet(urls.categories),
  },
  questions: {
    valid: questionsHandler(riskQuestionsFixture),
    malformed: questionsHandler(malformedRiskFixtures.questions),
    failure: guardedGet(urls.questions, riskErrorFixtures.server, 500),
    delayed: delayedGet(urls.questions, riskQuestionsFixture),
    backendUnauthorized: backendUnauthorizedGet(urls.questions),
  },
  submission: {
    publicSuccess: submissionHandler(publicAssessmentResponseFixture),
    dashboardSuccess: submissionHandler(dashboardAssessmentResponseFixture),
    unauthorized: submissionStatusHandler(riskErrorFixtures.expired, 401),
    validationFailure: submissionStatusHandler(riskErrorFixtures.validation, 422),
    failure: submissionStatusHandler(riskErrorFixtures.server, 500),
  },
  latest: {
    success: guardedGet(urls.latest, dashboardAssessmentResponseFixture),
    malformed: guardedGet(urls.latest, malformedRiskFixtures.assessment),
    notFound: guardedGet(urls.latest, { detail: 'No risk assessment found' }, 404),
    failure: guardedGet(urls.latest, riskErrorFixtures.server, 500),
    delayed: delayedGet(urls.latest, dashboardAssessmentResponseFixture),
    backendUnauthorized: backendUnauthorizedGet(urls.latest),
  },
  history: {
    success: guardedGet(urls.history, assessmentHistoryFixture),
    empty: guardedGet(urls.history, []),
    malformed: guardedGet(urls.history, malformedRiskFixtures.history),
    failure: guardedGet(urls.history, riskErrorFixtures.server, 500),
    delayed: delayedGet(urls.history, assessmentHistoryFixture),
    backendUnauthorized: backendUnauthorizedGet(urls.history),
  },
  recommendations: {
    success: guardedGet(urls.recommendations, riskRecommendationsFixture),
    empty: guardedGet(urls.recommendations, emptyRiskRecommendationsFixture),
    malformed: guardedGet(urls.recommendations, malformedRiskFixtures.recommendations),
    failure: guardedGet(urls.recommendations, riskErrorFixtures.server, 500),
    delayed: delayedGet(urls.recommendations, riskRecommendationsFixture),
    backendUnauthorized: backendUnauthorizedGet(urls.recommendations),
  },
} as const;

export const riskHandlers = [
  riskHandlerScenarios.categories.valid,
  riskHandlerScenarios.questions.valid,
  riskHandlerScenarios.submission.publicSuccess,
  riskHandlerScenarios.latest.success,
  riskHandlerScenarios.history.success,
  riskHandlerScenarios.recommendations.success,
];
