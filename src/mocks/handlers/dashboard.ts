import { delay, http, HttpResponse } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  assessedDashboardOverview,
  dashboardOverviewError,
  malformedDashboardOverview,
  unassessedDashboardOverview,
} from '@/mocks/fixtures/dashboard';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const OVERVIEW_URL = `${BASE}${ENDPOINTS.DASHBOARD.OVERVIEW}`;

export const DASHBOARD_LOADING_DELAY_MS = 120;

function hasBearerToken(request: Request): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '');
}

function unauthorizedResponse() {
  return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
}

export const dashboardHandlerScenarios = {
  unassessed: http.get(OVERVIEW_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(unassessedDashboardOverview);
  }),
  assessed: http.get(OVERVIEW_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(assessedDashboardOverview);
  }),
  malformed: http.get(OVERVIEW_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(malformedDashboardOverview);
  }),
  failure: http.get(OVERVIEW_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(dashboardOverviewError, { status: 503 });
  }),
  delayed: http.get(OVERVIEW_URL, async ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    await delay(DASHBOARD_LOADING_DELAY_MS);
    return HttpResponse.json(unassessedDashboardOverview);
  }),
} as const;

export const dashboardHandlers = [dashboardHandlerScenarios.unassessed];
