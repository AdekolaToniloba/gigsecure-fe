import type { components } from './schema';

export type NotificationPrefsResponse = components['schemas']['NotificationPrefsResponse'];
export type UpdateNotificationPrefsRequest =
  components['schemas']['UpdateNotificationPrefsRequest'];
export type NotificationPreferenceKey = keyof NotificationPrefsResponse;

export type PrivacySettingsResponse = components['schemas']['PrivacySettingsResponse'];
export type UpdatePrivacySettingsRequest = components['schemas']['UpdatePrivacySettingsRequest'];
export type PrivacySettingKey = keyof PrivacySettingsResponse;

export type DeleteAccountRequest = components['schemas']['DeleteAccountRequest'];
