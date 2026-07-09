import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { policyFixtures } from '@/mocks/fixtures/policies';
import { policyHandlerScenarios } from '@/mocks/handlers/policies';
import { server } from '@/mocks/server';
import { policiesService } from '@/services/policies.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const policiesUrl = `${baseUrl}${ENDPOINTS.POLICIES.LIST}`;

function pdfReportBody(content: string) {
  return new TextEncoder().encode(content);
}

beforeEach(() => {
  useAuthStore.getState().setSession({
    accessToken: 'policy-service-token',
    kycVerified: true,
    riskAssessed: true,
  });
});

describe('policies service', () => {
  it('gets summary, filtered list, and detail through authenticated apiClient requests', async () => {
    const seenFilters: Array<string | null> = [];

    server.use(
      http.get(policiesUrl, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer policy-service-token');
        seenFilters.push(new URL(request.url).searchParams.get('status_filter'));
        return HttpResponse.json({
          items: policyFixtures.filter((policy) => policy.status === 'active'),
        });
      })
    );

    await expect(policiesService.getSummary()).resolves.toEqual({
      total_coverage: '690000',
      active_count: 2,
      due_soon_count: 1,
    });
    const activePolicies = await policiesService.listPolicies({ statusFilter: 'active' });
    expect(activePolicies.items).toHaveLength(2);
    expect(activePolicies.items.every((policy) => policy.status === 'active')).toBe(true);
    await expect(policiesService.getPolicy('pol-income-active')).resolves.toMatchObject({
      product: { name: 'Income Shield for Gig Workers' },
    });
    expect(seenFilters).toEqual(['active']);
  });

  it('rejects invalid JSON payload shapes with a validation boundary error', async () => {
    server.use(policyHandlerScenarios.listMalformed);

    await expect(policiesService.listPolicies()).rejects.toThrow(
      'Invalid API response shape in policiesService.listPolicies'
    );
  });

  it('propagates 401 and 500 errors for parseApiError consumers', async () => {
    useAuthStore.getState().clearAuth();
    await expect(policiesService.listPolicies()).rejects.toMatchObject({
      response: { status: 401 },
    });

    useAuthStore.getState().setSession({
      accessToken: 'policy-service-token',
      kycVerified: true,
      riskAssessed: true,
    });
    server.use(policyHandlerScenarios.summaryFailure);
    await expect(policiesService.getSummary()).rejects.toMatchObject({
      response: { status: 503 },
    });
  });

  it('downloads a non-empty PDF report using Content-Disposition filename metadata', async () => {
    const report = await policiesService.downloadPolicyReport('pol-income-active');

    expect(report.filename).toBe('gigsecure-policy-pol-income-active-report.pdf');
    expect(report.contentType).toContain('application/pdf');
    expect(report.blob.size).toBeGreaterThan(0);
  });

  it('falls back to a safe filename and rejects empty or unsupported report content', async () => {
    server.use(
      http.get(`${policiesUrl}/:id/report`, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer policy-service-token');
        return new HttpResponse(pdfReportBody('%PDF-1.4\nfallback\n%%EOF'), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        });
      })
    );

    await expect(policiesService.downloadPolicyReport('pol-fallback')).resolves.toMatchObject({
      filename: 'gigsecure-policy-pol-fallback-report.pdf',
    });

    server.use(policyHandlerScenarios.reportEmpty);
    await expect(policiesService.downloadPolicyReport('pol-income-active')).rejects.toThrow(
      'Policy report is not available for download yet.'
    );

    server.use(
      http.get(`${policiesUrl}/:id/report`, () =>
        HttpResponse.json({ message: 'Report created' })
      )
    );
    await expect(policiesService.downloadPolicyReport('pol-income-active')).rejects.toThrow(
      'Policy report download format is not available yet.'
    );
  });
});
