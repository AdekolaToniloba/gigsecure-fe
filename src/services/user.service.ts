import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  userWithProfileResponseSchema,
  type UserWithProfileResponse,
  type UpdateProfileRequest,
} from '@/lib/validators/user';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const userService = {
  async getMe(signal?: AbortSignal): Promise<UserWithProfileResponse> {
    const { data } = await apiClient.get(ENDPOINTS.USERS.ME, { signal });
    return parseOrThrow(userWithProfileResponseSchema, data, 'userService.getMe');
  },

  async updateProfile(payload: UpdateProfileRequest, signal?: AbortSignal): Promise<UserWithProfileResponse> {
    const { data } = await apiClient.put(ENDPOINTS.USERS.ME, payload, { signal });
    return parseOrThrow(userWithProfileResponseSchema, data, 'userService.updateProfile');
  },
};
