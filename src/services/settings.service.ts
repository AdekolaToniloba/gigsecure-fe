import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  deleteAccountRequestSchema,
  notificationPrefsResponseSchema,
  privacySettingsResponseSchema,
  updateNotificationPrefsRequestSchema,
  updatePrivacySettingsRequestSchema,
} from '@/lib/validators/settings';
import type {
  DeleteAccountRequest,
  NotificationPrefsResponse,
  PrivacySettingsResponse,
  UpdateNotificationPrefsRequest,
  UpdatePrivacySettingsRequest,
} from '@/types/settings';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error(`[Zod] Validation failed in ${context}:`, error);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

function assertNoContent(status: number, context: string) {
  if (status !== 204) {
    throw new Error(`Invalid API response status in ${context}`);
  }
}

export const settingsService = {
  async getNotificationPrefs(signal?: AbortSignal): Promise<NotificationPrefsResponse> {
    const { data } = await apiClient.get(ENDPOINTS.SETTINGS.NOTIFICATIONS, { signal });
    return parseOrThrow(
      notificationPrefsResponseSchema,
      data,
      'settingsService.getNotificationPrefs',
    );
  },

  async updateNotificationPrefs(
    payload: UpdateNotificationPrefsRequest,
    signal?: AbortSignal,
  ): Promise<NotificationPrefsResponse> {
    const request = updateNotificationPrefsRequestSchema.parse(payload);
    const { data } = await apiClient.put(ENDPOINTS.SETTINGS.NOTIFICATIONS, request, { signal });
    return parseOrThrow(
      notificationPrefsResponseSchema,
      data,
      'settingsService.updateNotificationPrefs',
    );
  },

  async getPrivacySettings(signal?: AbortSignal): Promise<PrivacySettingsResponse> {
    const { data } = await apiClient.get(ENDPOINTS.SETTINGS.PRIVACY, { signal });
    return parseOrThrow(privacySettingsResponseSchema, data, 'settingsService.getPrivacySettings');
  },

  async updatePrivacySettings(
    payload: UpdatePrivacySettingsRequest,
    signal?: AbortSignal,
  ): Promise<PrivacySettingsResponse> {
    const request = updatePrivacySettingsRequestSchema.parse(payload);
    const { data } = await apiClient.put(ENDPOINTS.SETTINGS.PRIVACY, request, { signal });
    return parseOrThrow(
      privacySettingsResponseSchema,
      data,
      'settingsService.updatePrivacySettings',
    );
  },

  async deactivateAccount(signal?: AbortSignal): Promise<void> {
    const response = await apiClient.post(ENDPOINTS.SETTINGS.ACCOUNT_DEACTIVATE, undefined, {
      signal,
    });
    assertNoContent(response.status, 'settingsService.deactivateAccount');
  },

  async deleteAccount(payload: DeleteAccountRequest, signal?: AbortSignal): Promise<void> {
    const request = deleteAccountRequestSchema.parse(payload);
    const response = await apiClient.delete(ENDPOINTS.SETTINGS.ACCOUNT, {
      data: request,
      signal,
    });
    assertNoContent(response.status, 'settingsService.deleteAccount');
  },
};
