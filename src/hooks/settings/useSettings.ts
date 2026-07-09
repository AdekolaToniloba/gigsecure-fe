import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { settingsService } from '@/services/settings.service';
import type {
  DeleteAccountRequest,
  NotificationPreferenceKey,
  NotificationPrefsResponse,
  PrivacySettingKey,
  PrivacySettingsResponse,
  UpdateNotificationPrefsRequest,
  UpdatePrivacySettingsRequest,
} from '@/types/settings';

export const SETTINGS_STALE_TIME = 5 * 60 * 1000;

export function useNotificationSettings({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.SETTINGS_NOTIFICATIONS,
    queryFn: ({ signal }) => settingsService.getNotificationPrefs(signal),
    enabled,
    staleTime: SETTINGS_STALE_TIME,
    retry: false,
    throwOnError: false,
  });
}

export function usePrivacySettings({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.SETTINGS_PRIVACY,
    queryFn: ({ signal }) => settingsService.getPrivacySettings(signal),
    enabled,
    staleTime: SETTINGS_STALE_TIME,
    retry: false,
    throwOnError: false,
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: NotificationPreferenceKey; value: boolean }) => {
      const payload = { [key]: value } as UpdateNotificationPrefsRequest;
      return settingsService.updateNotificationPrefs(payload);
    },
    retry: false,
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SETTINGS_NOTIFICATIONS });
      const previous = queryClient.getQueryData<NotificationPrefsResponse>(
        QUERY_KEYS.SETTINGS_NOTIFICATIONS,
      );
      if (previous) {
        queryClient.setQueryData<NotificationPrefsResponse>(QUERY_KEYS.SETTINGS_NOTIFICATIONS, {
          ...previous,
          [key]: value,
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.SETTINGS_NOTIFICATIONS, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.SETTINGS_NOTIFICATIONS, data);
    },
  });
}

export function useUpdatePrivacySetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: PrivacySettingKey; value: boolean }) => {
      const payload = { [key]: value } as UpdatePrivacySettingsRequest;
      return settingsService.updatePrivacySettings(payload);
    },
    retry: false,
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SETTINGS_PRIVACY });
      const previous = queryClient.getQueryData<PrivacySettingsResponse>(
        QUERY_KEYS.SETTINGS_PRIVACY,
      );
      if (previous) {
        queryClient.setQueryData<PrivacySettingsResponse>(QUERY_KEYS.SETTINGS_PRIVACY, {
          ...previous,
          [key]: value,
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.SETTINGS_PRIVACY, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.SETTINGS_PRIVACY, data);
    },
  });
}

export function useDeactivateAccount() {
  return useMutation({
    mutationFn: () => settingsService.deactivateAccount(),
    retry: false,
  });
}

export function useDeleteAccount() {
  return useMutation<void, unknown, DeleteAccountRequest>({
    mutationFn: (payload) => settingsService.deleteAccount(payload),
    retry: false,
  });
}
