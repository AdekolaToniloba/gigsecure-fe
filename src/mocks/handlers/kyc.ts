import { http, HttpResponse } from 'msw';
import { kycVerifyRequestSchema } from '@/lib/validators/kyc';
import type { KYCStatusResponse, KYCVerifyResponse, KycStatus } from '@/types/kyc';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const statusFixtures: Record<Exclude<KycStatus, null>, KYCStatusResponse> = {
  pending: {
    status: 'pending',
    document_type: 'NIN',
    verified_at: null,
    rejection_reason: null,
  },
  verified: {
    status: 'verified',
    document_type: 'NIN',
    verified_at: '2026-04-24T10:00:00Z',
    rejection_reason: null,
  },
  rejected: {
    status: 'rejected',
    document_type: 'NIN',
    verified_at: null,
    rejection_reason: 'Submitted details did not match identity records.',
  },
  failed: {
    status: 'failed',
    document_type: 'NIN',
    verified_at: null,
    rejection_reason: 'Verification could not be completed due to a technical issue.',
  },
};

const noAttemptStatus: KYCStatusResponse = {
  status: null,
  document_type: null,
  verified_at: null,
  rejection_reason: null,
};

export const kycHandlers = [
  http.post(`${BASE}/api/v1/kyc/verify`, async ({ request }) => {
    const body = await request.json();
    const parsed = kycVerifyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        {
          detail: parsed.error.issues.map((issue) => ({
            loc: ['body', ...issue.path],
            msg: issue.message,
            type: issue.code,
          })),
        },
        { status: 422 }
      );
    }

    const { document_number } = parsed.data;
    let response: KYCVerifyResponse;

    if (document_number === '11111111111') {
      response = {
        status: 'rejected',
        message: 'Submitted details did not match identity records.',
        smile_job_id: '500000002',
      };
    } else if (document_number === '22222222222') {
      response = {
        status: 'failed',
        message: 'Verification could not be completed due to a technical issue.',
        smile_job_id: '500000003',
      };
    } else {
      response = {
        status: 'verified',
        message: 'Identity verified successfully.',
        smile_job_id: '500000001',
      };
    }

    return HttpResponse.json(response);
  }),

  http.get(`${BASE}/api/v1/kyc/status`, ({ request }) => {
    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get('status') as KycStatus;

    if (!requestedStatus) {
      return HttpResponse.json(noAttemptStatus);
    }

    return HttpResponse.json(statusFixtures[requestedStatus] ?? noAttemptStatus);
  }),
];
