import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { kycService } from '@/services/kyc.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const validPayload = {
  document_type: 'NIN' as const,
  document_number: '12345678901',
  first_name: 'Amaka',
  last_name: 'Obi',
  date_of_birth: '1995-06-15',
};

beforeEach(() => {
  useAuthStore.getState().clearAuth();
});

describe('kycService', () => {
  it('posts verification payloads through apiClient with auth headers', async () => {
    expect.assertions(5);
    useAuthStore.getState().setSession({
      accessToken: 'access-token',
      kycVerified: false,
      riskAssessed: true,
    });

    server.use(
      http.post(`${baseUrl}/api/v1/kyc/verify`, async ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer access-token');
        expect(request.headers.get('x-requested-with')).toBe('XMLHttpRequest');
        expect(await request.json()).toEqual(validPayload);

        return HttpResponse.json({
          status: 'verified',
          message: 'Identity verified successfully.',
          smile_job_id: '500000001',
        });
      })
    );

    const result = await kycService.verify(validPayload);

    expect(result.status).toBe('verified');
    expect(result.smile_job_id).toBe('500000001');
  });

  it('parses rejected and failed verification responses', async () => {
    await expect(
      kycService.verify({ ...validPayload, document_number: '11111111111' })
    ).resolves.toMatchObject({
      status: 'rejected',
      message: 'Submitted details did not match identity records.',
    });

    await expect(
      kycService.verify({ ...validPayload, document_number: '22222222222' })
    ).resolves.toMatchObject({
      status: 'failed',
      message: 'Verification could not be completed due to a technical issue.',
    });
  });

  it('gets the current KYC status through apiClient', async () => {
    const result = await kycService.getStatus();

    expect(result).toEqual({
      status: null,
      document_type: null,
      verified_at: null,
      rejection_reason: null,
    });
  });

  it('parses verified KYC status responses', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/kyc/status`, () =>
        HttpResponse.json({
          status: 'verified',
          document_type: 'NIN',
          verified_at: '2026-04-24T10:00:00Z',
          rejection_reason: null,
        })
      )
    );

    await expect(kycService.getStatus()).resolves.toMatchObject({
      status: 'verified',
      document_type: 'NIN',
    });
  });

  it('rejects invalid verification response shapes', async () => {
    server.use(
      http.post(`${baseUrl}/api/v1/kyc/verify`, () =>
        HttpResponse.json({ status: 'pending', message: 'Unexpected verify status.' })
      )
    );

    await expect(kycService.verify(validPayload)).rejects.toThrow(
      'Invalid API response shape in kycService.verify'
    );
  });
});
