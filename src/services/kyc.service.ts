import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  kycStatusResponseSchema,
  kycVerifyResponseSchema,
  type KYCStatusResponse,
  type KYCVerifyRequest,
  type KYCVerifyResponse,
} from '@/lib/validators/kyc';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const kycService = {
  async verify(payload: KYCVerifyRequest, signal?: AbortSignal): Promise<KYCVerifyResponse> {
    const { data } = await apiClient.post(ENDPOINTS.KYC.VERIFY, payload, { signal });
    return parseOrThrow(kycVerifyResponseSchema, data, 'kycService.verify');
  },

  async getStatus(signal?: AbortSignal): Promise<KYCStatusResponse> {
    const { data } = await apiClient.get(ENDPOINTS.KYC.STATUS, { signal });
    return parseOrThrow(kycStatusResponseSchema, data, 'kycService.getStatus');
  },
};
