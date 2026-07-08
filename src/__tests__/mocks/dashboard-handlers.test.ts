import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { dashboardOverviewSchema } from '@/lib/validators/dashboard';
import { riskAssessmentResponseSchema } from '@/lib/validators/risk';
import { userWithProfileResponseSchema } from '@/lib/validators/user';
import {
  assessedDashboardOverview,
  dashboardOverviewError,
  dashboardProfileFixtures,
  latestAssessmentFixture,
  malformedDashboardOverview,
  unassessedDashboardOverview,
} from '@/mocks/fixtures/dashboard';
import { dashboardNotificationFixtures } from '@/mocks/fixtures/dashboard-notifications';
import {
  DASHBOARD_LOADING_DELAY_MS,
  dashboardHandlers,
  dashboardHandlerScenarios,
} from '@/mocks/handlers/dashboard';
import { handlers } from '@/mocks/handlers';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const overviewUrl = `${baseUrl}${ENDPOINTS.DASHBOARD.OVERVIEW}`;
const authenticatedRequest = { headers: { Authorization: 'Bearer dashboard-access-token' } };

describe('dashboard fixtures', () => {
  it('provides valid unassessed and assessed overview contracts', () => {
    expect(dashboardOverviewSchema.parse(unassessedDashboardOverview)).toEqual(
      unassessedDashboardOverview
    );
    expect(dashboardOverviewSchema.parse(assessedDashboardOverview)).toEqual(
      assessedDashboardOverview
    );
    expect(assessedDashboardOverview.income_stability?.graph_points)
      .toEqual([18, 26, 22, 35, 31, 42, 38, 47]);
  });

  it('keeps KYC and assessment profile flags independent', () => {
    const unassessed = userWithProfileResponseSchema.parse(
      dashboardProfileFixtures.unassessedKycVerified
    );
    const assessed = userWithProfileResponseSchema.parse(
      dashboardProfileFixtures.assessedKycUnverified
    );

    expect(unassessed).toMatchObject({ kyc_verified: true, risk_assessed: false });
    expect(assessed).toMatchObject({ kyc_verified: false, risk_assessed: true });
    expect(unassessed.user.first_name.length).toBeGreaterThan(12);
  });

  it('provides deliberately malformed overview data for service rejection tests', () => {
    expect(dashboardOverviewSchema.safeParse(malformedDashboardOverview).success).toBe(false);
  });

  it('provides a corrected latest-assessment contract', () => {
    expect(riskAssessmentResponseSchema.parse(latestAssessmentFixture)).toEqual(
      latestAssessmentFixture
    );
  });
});

describe('dashboard MSW handlers', () => {
  it('serves the default unassessed overview only with a Bearer token', async () => {
    const unauthorized = await fetch(overviewUrl);
    expect(unauthorized.status).toBe(401);
    await expect(unauthorized.json()).resolves.toEqual({ detail: 'Not authenticated' });

    const response = await fetch(overviewUrl, authenticatedRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(unassessedDashboardOverview);
  });

  it('serves the assessed overview through an override of the same real endpoint', async () => {
    server.use(dashboardHandlerScenarios.assessed);

    const response = await fetch(overviewUrl, authenticatedRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(assessedDashboardOverview);
  });

  it('supports deterministic authenticated failure and malformed scenarios', async () => {
    server.use(dashboardHandlerScenarios.failure);
    const failedResponse = await fetch(overviewUrl, authenticatedRequest);
    expect(failedResponse.status).toBe(503);
    await expect(failedResponse.json()).resolves.toEqual(dashboardOverviewError);

    server.use(dashboardHandlerScenarios.malformed);
    const malformedResponse = await fetch(overviewUrl, authenticatedRequest);
    expect(malformedResponse.status).toBe(200);
    await expect(malformedResponse.json()).resolves.toEqual(malformedDashboardOverview);
  });

  it('supports a delayed loading response', async () => {
    server.use(dashboardHandlerScenarios.delayed);
    const startedAt = performance.now();

    const response = await fetch(overviewUrl, authenticatedRequest);

    expect(response.status).toBe(200);
    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(
      DASHBOARD_LOADING_DELAY_MS - 20
    );
  });

  it('registers the same dashboard handler in browser and Node MSW', () => {
    expect(server.listHandlers()).toContain(dashboardHandlers[0]);
    expect(handlers).toContain(dashboardHandlers[0]);
    expect(dashboardHandlers[0].info).toMatchObject({ method: 'GET', path: overviewUrl });
  });

  it('keeps notification examples component-only with no dashboard feed handler', () => {
    expect(dashboardNotificationFixtures).toHaveLength(2);
    expect(dashboardNotificationFixtures.some((item) => item.title.length > 40)).toBe(true);
    expect(Object.values(dashboardHandlerScenarios).every(
      (handler) => handler.info.path === overviewUrl
    )).toBe(true);
  });

  it('replaces the stale latest-assessment network response', async () => {
    const response = await fetch(`${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`, authenticatedRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(riskAssessmentResponseSchema.parse(body)).toEqual(latestAssessmentFixture);
  });
});
