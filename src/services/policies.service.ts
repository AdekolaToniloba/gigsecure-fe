import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  policySchema,
  policiesListResponseSchema,
  type Policy,
  type CreatePolicyRequest,
} from '@/lib/validators/policies';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const policiesService = {
  async listPolicies(signal?: AbortSignal): Promise<Policy[]> {
    const { data } = await apiClient.get(ENDPOINTS.POLICIES.LIST, { signal });
    return parseOrThrow(policiesListResponseSchema, data, 'policiesService.listPolicies');
  },

  async getPolicy(id: string, signal?: AbortSignal): Promise<Policy> {
    const { data } = await apiClient.get(ENDPOINTS.POLICIES.DETAIL(id), { signal });
    return parseOrThrow(policySchema, data, 'policiesService.getPolicy');
  },

  async createPolicy(payload: CreatePolicyRequest, signal?: AbortSignal): Promise<Policy> {
    const { data } = await apiClient.post(ENDPOINTS.POLICIES.CREATE, payload, { signal });
    return parseOrThrow(policySchema, data, 'policiesService.createPolicy');
  },

  async cancelPolicy(id: string, signal?: AbortSignal): Promise<Policy> {
    const { data } = await apiClient.post(ENDPOINTS.POLICIES.CANCEL(id), {}, { signal });
    return parseOrThrow(policySchema, data, 'policiesService.cancelPolicy');
  },

  async renewPolicy(id: string, signal?: AbortSignal): Promise<Policy> {
    const { data } = await apiClient.post(ENDPOINTS.POLICIES.RENEW(id), {}, { signal });
    return parseOrThrow(policySchema, data, 'policiesService.renewPolicy');
  },
};
