import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  notificationPrefsFixture,
  privacySettingsFixture,
} from '@/mocks/fixtures/settings';
import { settingsHandlerScenarios } from '@/mocks/handlers/settings';
import { server } from '@/mocks/server';
import { settingsService } from '@/services/settings.service';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const NOTIFICATIONS_URL = `${BASE}${ENDPOINTS.SETTINGS.NOTIFICATIONS}`;
const PRIVACY_URL = `${BASE}${ENDPOINTS.SETTINGS.PRIVACY}`;
const ACCOUNT_DEACTIVATE_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT_DEACTIVATE}`;
const ACCOUNT_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT}`;

beforeEach(() => {
  useAuthStore.getState().setSession({
    accessToken: 'settings-service-token',
    kycVerified: true,
    riskAssessed: true,
  });
});

describe('settingsService', () => {
  it('fetches notification preferences through the authenticated client', async () => {
    expect.assertions(3);
    server.use(
      http.get(NOTIFICATIONS_URL, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer settings-service-token');
        expect(request.headers.get('x-requested-with')).toBe('XMLHttpRequest');
        return HttpResponse.json(notificationPrefsFixture);
      }),
    );

    await expect(settingsService.getNotificationPrefs()).resolves.toEqual(notificationPrefsFixture);
  });

  it('sends only the documented changed notification key on update', async () => {
    expect.assertions(2);
    server.use(
      http.put(NOTIFICATIONS_URL, async ({ request }) => {
        expect(await request.json()).toEqual({ product_updates: true });
        return HttpResponse.json({ ...notificationPrefsFixture, product_updates: true });
      }),
    );

    await expect(settingsService.updateNotificationPrefs({ product_updates: true }))
      .resolves.toMatchObject({ product_updates: true });
  });

  it('fetches and updates privacy settings through documented endpoints', async () => {
    expect.assertions(3);
    server.use(
      http.get(PRIVACY_URL, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer settings-service-token');
        return HttpResponse.json(privacySettingsFixture);
      }),
      http.put(PRIVACY_URL, async ({ request }) => {
        expect(await request.json()).toEqual({ share_data_with_partners: true });
        return HttpResponse.json({ ...privacySettingsFixture, share_data_with_partners: true });
      }),
    );

    await expect(settingsService.getPrivacySettings()).resolves.toEqual(privacySettingsFixture);
    await settingsService.updatePrivacySettings({ share_data_with_partners: true });
  });

  it('validates malformed settings responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(settingsHandlerScenarios.malformedNotifications);

    await expect(settingsService.getNotificationPrefs()).rejects.toThrow(
      'Invalid API response shape in settingsService.getNotificationPrefs',
    );

    server.use(settingsHandlerScenarios.malformedPrivacy);
    await expect(settingsService.getPrivacySettings()).rejects.toThrow(
      'Invalid API response shape in settingsService.getPrivacySettings',
    );
  });

  it('supports AbortSignal cancellation', async () => {
    server.use(
      http.get(NOTIFICATIONS_URL, async () => {
        await delay(1_000);
        return HttpResponse.json(notificationPrefsFixture);
      }),
    );
    const controller = new AbortController();
    const request = settingsService.getNotificationPrefs(controller.signal);

    controller.abort();

    await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });

  it('handles account deactivation and deletion as 204 actions', async () => {
    expect.assertions(4);
    server.use(
      http.post(ACCOUNT_DEACTIVATE_URL, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer settings-service-token');
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete(ACCOUNT_URL, async ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer settings-service-token');
        expect(await request.json()).toEqual({ password: 'correct-horse' });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(settingsService.deactivateAccount()).resolves.toBeUndefined();
    await settingsService.deleteAccount({ password: 'correct-horse' });
  });
});
