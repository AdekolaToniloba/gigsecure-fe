import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  claimSchema,
  claimsListResponseSchema,
  claimStatusResponseSchema,
  type Claim,
  type ClaimStatusResponse,
  type SubmitClaimRequest,
} from '@/lib/validators/claims';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const claimsService = {
  async listClaims(signal?: AbortSignal): Promise<Claim[]> {
    const { data } = await apiClient.get(ENDPOINTS.CLAIMS.LIST, { signal });
    return parseOrThrow(claimsListResponseSchema, data, 'claimsService.listClaims');
  },

  async getClaim(id: string, signal?: AbortSignal): Promise<Claim> {
    const { data } = await apiClient.get(ENDPOINTS.CLAIMS.DETAIL(id), { signal });
    return parseOrThrow(claimSchema, data, 'claimsService.getClaim');
  },

  async getClaimStatus(id: string, signal?: AbortSignal): Promise<ClaimStatusResponse> {
    const { data } = await apiClient.get(ENDPOINTS.CLAIMS.STATUS(id), { signal });
    return parseOrThrow(claimStatusResponseSchema, data, 'claimsService.getClaimStatus');
  },

  async submitClaim(payload: SubmitClaimRequest, signal?: AbortSignal): Promise<Claim> {
    const { data } = await apiClient.post(ENDPOINTS.CLAIMS.SUBMIT, payload, { signal });
    return parseOrThrow(claimSchema, data, 'claimsService.submitClaim');
  },

  async uploadDocuments(id: string, formData: FormData, signal?: AbortSignal) {
    const { data } = await apiClient.post(ENDPOINTS.CLAIMS.DOCUMENTS(id), formData, {
      signal,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
