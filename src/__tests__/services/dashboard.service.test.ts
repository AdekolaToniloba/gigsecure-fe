import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { dashboardHandlerScenarios } from '@/mocks/handlers/dashboard';
import { unassessedDashboardOverview } from '@/mocks/fixtures/dashboard';
import { server } from '@/mocks/server';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const overviewUrl = `${baseUrl}${ENDPOINTS.DASHBOARD.OVERVIEW}`;

beforeEach(() => {
  useAuthStore.getState().setSession({
    accessToken: 'dashboard-service-token',
    kycVerified: true,
    riskAssessed: false,
  });
});

describe('dashboardService', () => {
  it('uses the authenticated client, endpoint constant, and AbortSignal', async () => {
    expect.assertions(4);
    const controller = new AbortController();

    server.use(
      http.get(overviewUrl, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer dashboard-service-token');
        expect(request.headers.get('x-requested-with')).toBe('XMLHttpRequest');
        expect(request.signal.aborted).toBe(false);
        return HttpResponse.json(unassessedDashboardOverview);
      })
    );

    await expect(dashboardService.getOverview(controller.signal)).resolves.toEqual(
      unassessedDashboardOverview
    );
  });

  it('forwards cancellation to the request', async () => {
    server.use(
      http.get(overviewUrl, async () => {
        await delay(1_000);
        return HttpResponse.json(unassessedDashboardOverview);
      })
    );
    const controller = new AbortController();
    const request = dashboardService.getOverview(controller.signal);

    controller.abort();

    await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });

  it('rejects malformed overview responses with the established error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(dashboardHandlerScenarios.malformed);

    await expect(dashboardService.getOverview()).rejects.toThrow(
      'Invalid API response shape in dashboardService.getOverview'
    );
  });
});
