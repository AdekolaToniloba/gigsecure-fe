import { z } from 'zod';
import type {
  DeleteAccountRequest,
  NotificationPrefsResponse,
  PrivacySettingsResponse,
  UpdateNotificationPrefsRequest,
  UpdatePrivacySettingsRequest,
} from '@/types/settings';

export const notificationPrefsResponseSchema: z.ZodType<NotificationPrefsResponse> = z.object({
  risk_score_updates: z.boolean(),
  premium_renewals: z.boolean(),
  new_plan_recommendations: z.boolean(),
  payment_confirmations: z.boolean(),
  product_updates: z.boolean(),
});

export const updateNotificationPrefsRequestSchema: z.ZodType<UpdateNotificationPrefsRequest> =
  z.object({
    risk_score_updates: z.boolean().nullable().optional(),
    premium_renewals: z.boolean().nullable().optional(),
    new_plan_recommendations: z.boolean().nullable().optional(),
    payment_confirmations: z.boolean().nullable().optional(),
    product_updates: z.boolean().nullable().optional(),
  });

export const privacySettingsResponseSchema: z.ZodType<PrivacySettingsResponse> = z.object({
  share_anonymised_data: z.boolean(),
  personalise_recommendations: z.boolean(),
  share_data_with_partners: z.boolean(),
});

export const updatePrivacySettingsRequestSchema: z.ZodType<UpdatePrivacySettingsRequest> =
  z.object({
    share_anonymised_data: z.boolean().nullable().optional(),
    personalise_recommendations: z.boolean().nullable().optional(),
    share_data_with_partners: z.boolean().nullable().optional(),
  });

export const deleteAccountRequestSchema: z.ZodType<DeleteAccountRequest> = z.object({
  password: z.string().trim().min(1, 'Enter your password to delete your account.'),
});
