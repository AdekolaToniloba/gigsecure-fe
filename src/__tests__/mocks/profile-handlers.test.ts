import { describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { profileHandlerScenarios } from '@/mocks/handlers/profile';
import { server } from '@/mocks/server';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const profileUrl = `${baseUrl}${ENDPOINTS.USERS.ME}`;

function authHeaders() {
  return { authorization: 'Bearer profile-test-token' };
}

describe('profile MSW handlers', () => {
  it('requires Bearer authentication for profile requests', async () => {
    const response = await fetch(profileUrl);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ detail: 'Not authenticated' });
  });

  it('serves a successful empty profile by default', async () => {
    const response = await fetch(profileUrl, { headers: authHeaders() });

    await expect(response.json()).resolves.toMatchObject({
      user: expect.objectContaining({ email: 'test@gigsecure.com' }),
      profile: null,
      risk_assessed: true,
    });
  });

  it('supports complete, validation-error, and malformed response scenarios', async () => {
    server.use(profileHandlerScenarios.getComplete, profileHandlerScenarios.updateValidationError);

    const getResponse = await fetch(profileUrl, { headers: authHeaders() });
    const updateResponse = await fetch(profileUrl, {
      method: 'PUT',
      headers: {
        ...authHeaders(),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ city: 'Lagos' }),
    });

    await expect(getResponse.json()).resolves.toMatchObject({
      profile: expect.objectContaining({ city: 'Lagos' }),
      kyc_verified: true,
    });
    expect(updateResponse.status).toBe(422);
    await expect(updateResponse.json()).resolves.toMatchObject({
      detail: [expect.objectContaining({ loc: ['body', 'average_monthly_income'] })],
    });

    server.use(profileHandlerScenarios.getMalformed);
    const malformedResponse = await fetch(profileUrl, { headers: authHeaders() });
    await expect(malformedResponse.json()).resolves.toMatchObject({
      user: expect.objectContaining({ id: 'not-a-uuid' }),
    });
  });
});
