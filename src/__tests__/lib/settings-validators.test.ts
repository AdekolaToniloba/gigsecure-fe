import { describe, expect, it } from 'vitest';
import {
  deleteAccountRequestSchema,
  notificationPrefsResponseSchema,
  privacySettingsResponseSchema,
  updateNotificationPrefsRequestSchema,
  updatePrivacySettingsRequestSchema,
} from '@/lib/validators/settings';
import {
  notificationPrefsFixture,
  privacySettingsFixture,
} from '@/mocks/fixtures/settings';

describe('settings validators', () => {
  it('parses documented notification preferences only', () => {
    expect(notificationPrefsResponseSchema.parse(notificationPrefsFixture)).toEqual(
      notificationPrefsFixture,
    );
    expect(notificationPrefsResponseSchema.safeParse({
      ...notificationPrefsFixture,
      product_updates: 'false',
    }).success).toBe(false);
  });

  it('parses partial notification updates with nullable booleans', () => {
    expect(updateNotificationPrefsRequestSchema.parse({
      risk_score_updates: false,
      product_updates: null,
    })).toEqual({
      risk_score_updates: false,
      product_updates: null,
    });
  });

  it('parses documented privacy settings and partial updates', () => {
    expect(privacySettingsResponseSchema.parse(privacySettingsFixture)).toEqual(
      privacySettingsFixture,
    );
    expect(updatePrivacySettingsRequestSchema.parse({
      share_anonymised_data: false,
      share_data_with_partners: null,
    })).toEqual({
      share_anonymised_data: false,
      share_data_with_partners: null,
    });
  });

  it('requires a non-empty delete account password', () => {
    expect(deleteAccountRequestSchema.safeParse({ password: 'correct-horse' }).success).toBe(true);
    expect(deleteAccountRequestSchema.safeParse({ password: '   ' }).success).toBe(false);
  });
});
