import type {
  NotificationPrefsResponse,
  PrivacySettingsResponse,
} from '@/types/settings';

export const notificationPrefsFixture: NotificationPrefsResponse = {
  risk_score_updates: true,
  premium_renewals: true,
  new_plan_recommendations: false,
  payment_confirmations: true,
  product_updates: false,
};

export const privacySettingsFixture: PrivacySettingsResponse = {
  share_anonymised_data: true,
  personalise_recommendations: true,
  share_data_with_partners: false,
};

export const malformedNotificationPrefs = {
  ...notificationPrefsFixture,
  product_updates: 'no',
};

export const malformedPrivacySettings = {
  ...privacySettingsFixture,
  share_data_with_partners: 'sometimes',
};
