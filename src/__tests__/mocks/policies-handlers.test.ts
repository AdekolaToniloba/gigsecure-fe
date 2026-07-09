import { describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { policyHandlerScenarios } from '@/mocks/handlers/policies';
import { server } from '@/mocks/server';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const policiesUrl = `${baseUrl}${ENDPOINTS.POLICIES.LIST}`;

function authHeaders() {
  return { authorization: 'Bearer policy-test-token' };
}

describe('policy MSW handlers', () => {
  it('requires Bearer authentication for policy list requests', async () => {
    const response = await fetch(policiesUrl);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ detail: 'Not authenticated' });
  });

  it('returns OpenAPI-shaped list responses and supports documented status_filter', async () => {
    const allResponse = await fetch(policiesUrl, { headers: authHeaders() });
    const activeResponse = await fetch(`${policiesUrl}?status_filter=active`, {
      headers: authHeaders(),
    });
    const expiredResponse = await fetch(`${policiesUrl}?status_filter=expired`, {
      headers: authHeaders(),
    });

    await expect(allResponse.json()).resolves.toMatchObject({ items: expect.any(Array) });
    await expect(activeResponse.json()).resolves.toMatchObject({
      items: [
        expect.objectContaining({ status: 'active' }),
        expect.objectContaining({ status: 'active' }),
      ],
    });
    await expect(expiredResponse.json()).resolves.toMatchObject({
      items: [expect.objectContaining({ status: 'expired' })],
    });
  });

  it('can serve an empty account state', async () => {
    server.use(policyHandlerScenarios.listEmpty, policyHandlerScenarios.summaryEmpty);

    const listResponse = await fetch(policiesUrl, { headers: authHeaders() });
    const summaryResponse = await fetch(`${baseUrl}${ENDPOINTS.POLICIES.SUMMARY}`, {
      headers: authHeaders(),
    });

    await expect(listResponse.json()).resolves.toEqual({ items: [] });
    await expect(summaryResponse.json()).resolves.toEqual({
      total_coverage: '0',
      active_count: 0,
      due_soon_count: 0,
    });
  });

  it('can serve malformed payloads for runtime validation tests', async () => {
    server.use(policyHandlerScenarios.listMalformed, policyHandlerScenarios.summaryMalformed);

    const listResponse = await fetch(policiesUrl, { headers: authHeaders() });
    const summaryResponse = await fetch(`${baseUrl}${ENDPOINTS.POLICIES.SUMMARY}`, {
      headers: authHeaders(),
    });

    await expect(listResponse.json()).resolves.toMatchObject({
      items: [expect.objectContaining({ user_id: expect.any(String) })],
    });
    await expect(summaryResponse.json()).resolves.toMatchObject({ total_coverage: 0 });
  });

  it('returns detail not-found and report success/error scenarios', async () => {
    const missingResponse = await fetch(`${policiesUrl}/missing-policy`, {
      headers: authHeaders(),
    });
    expect(missingResponse.status).toBe(404);

    const reportResponse = await fetch(`${policiesUrl}/pol-income-active/report`, {
      headers: authHeaders(),
    });
    expect(reportResponse.status).toBe(200);
    expect(reportResponse.headers.get('content-type')).toContain('application/pdf');
    expect(await reportResponse.text()).toContain('%PDF-1.4');

    server.use(policyHandlerScenarios.reportFailure);
    const failedReport = await fetch(`${policiesUrl}/pol-income-active/report`, {
      headers: authHeaders(),
    });
    expect(failedReport.status).toBe(503);
    await expect(failedReport.json()).resolves.toEqual({
      detail: 'Policy report is temporarily unavailable.',
    });
  });
});
