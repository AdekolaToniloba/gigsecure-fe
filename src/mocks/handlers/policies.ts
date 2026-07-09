import { delay, http, HttpResponse } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  emptyPolicyListFixture,
  emptyPolicySummaryFixture,
  malformedPolicyFixture,
  policyFixtures,
  policyListFixture,
  policySummaryFixture,
} from '@/mocks/fixtures/policies';
import type { PolicyListResponse, PolicySummary } from '@/types/policies';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const POLICIES_URL = `${BASE}${ENDPOINTS.POLICIES.LIST}`;
const POLICY_SUMMARY_URL = `${BASE}${ENDPOINTS.POLICIES.SUMMARY}`;

export const POLICIES_LOADING_DELAY_MS = 120;

function hasBearerToken(request: Request): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '');
}

function unauthorizedResponse() {
  return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
}

function pdfReportBody(content: string) {
  return new TextEncoder().encode(content);
}

function filteredPolicies(request: Request): PolicyListResponse {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status_filter');

  if (!statusFilter) return policyListFixture;

  return {
    items: policyFixtures.filter((policy) => policy.status === statusFilter),
  };
}

function listHandler(body: PolicyListResponse | typeof malformedPolicyFixture, status = 200) {
  return http.get(POLICIES_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(body, { status });
  });
}

function summaryHandler(body: PolicySummary | Record<string, unknown>, status = 200) {
  return http.get(POLICY_SUMMARY_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(body, { status });
  });
}

export const policyHandlerScenarios = {
  listSuccess: http.get(POLICIES_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(filteredPolicies(request));
  }),
  listEmpty: listHandler(emptyPolicyListFixture),
  listMalformed: listHandler(malformedPolicyFixture),
  listFailure: listHandler({ items: [] }, 503),
  listDelayed: http.get(POLICIES_URL, async ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    await delay(POLICIES_LOADING_DELAY_MS);
    return HttpResponse.json(filteredPolicies(request));
  }),
  summarySuccess: summaryHandler(policySummaryFixture),
  summaryEmpty: summaryHandler(emptyPolicySummaryFixture),
  summaryMalformed: summaryHandler({ total_coverage: 0, active_count: -1, due_soon_count: 'one' }),
  summaryFailure: summaryHandler({ detail: 'Policy summary is temporarily unavailable.' }, 503),
  detailSuccess: http.get(`${POLICIES_URL}/:id`, ({ request, params }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    const policy = policyFixtures.find((item) => item.id === params.id);
    return policy
      ? HttpResponse.json(policy)
      : HttpResponse.json({ detail: 'Policy not found' }, { status: 404 });
  }),
  detailMalformed: http.get(`${POLICIES_URL}/:id`, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json({ id: 'pol-malformed', status: 'active' });
  }),
  reportSuccess: http.get(`${POLICIES_URL}/:id/report`, ({ request, params }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return new HttpResponse(
      pdfReportBody(`%PDF-1.4\nGigSecure policy ${String(params.id)} report\n%%EOF`),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="gigsecure-policy-${String(params.id)}-report.pdf"`,
        },
      },
    );
  }),
  reportEmpty: http.get(`${POLICIES_URL}/:id/report`, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return new HttpResponse(null, { status: 200 });
  }),
  reportFailure: http.get(`${POLICIES_URL}/:id/report`, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json({ detail: 'Policy report is temporarily unavailable.' }, { status: 503 });
  }),
} as const;

export const policiesHandlers = [
  policyHandlerScenarios.listSuccess,
  policyHandlerScenarios.summarySuccess,
  policyHandlerScenarios.detailSuccess,
  policyHandlerScenarios.reportSuccess,
];
