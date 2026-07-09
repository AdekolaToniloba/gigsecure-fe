import { http, HttpResponse } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  malformedNotificationPrefs,
  malformedPrivacySettings,
  notificationPrefsFixture,
  privacySettingsFixture,
} from '@/mocks/fixtures/settings';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const NOTIFICATIONS_URL = `${BASE}${ENDPOINTS.SETTINGS.NOTIFICATIONS}`;
const PRIVACY_URL = `${BASE}${ENDPOINTS.SETTINGS.PRIVACY}`;
const ACCOUNT_DEACTIVATE_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT_DEACTIVATE}`;
const ACCOUNT_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT}`;

function hasBearerToken(request: Request): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '');
}

function unauthorizedResponse() {
  return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
}

export const settingsHandlerScenarios = {
  success: [
    http.get(NOTIFICATIONS_URL, ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      return HttpResponse.json(notificationPrefsFixture);
    }),
    http.put(NOTIFICATIONS_URL, async ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      const update = await request.json() as Partial<typeof notificationPrefsFixture>;
      return HttpResponse.json({ ...notificationPrefsFixture, ...update });
    }),
    http.get(PRIVACY_URL, ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      return HttpResponse.json(privacySettingsFixture);
    }),
    http.put(PRIVACY_URL, async ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      const update = await request.json() as Partial<typeof privacySettingsFixture>;
      return HttpResponse.json({ ...privacySettingsFixture, ...update });
    }),
    http.post(ACCOUNT_DEACTIVATE_URL, ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(ACCOUNT_URL, ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      return new HttpResponse(null, { status: 204 });
    }),
  ],
  malformedNotifications: http.get(NOTIFICATIONS_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(malformedNotificationPrefs);
  }),
  malformedPrivacy: http.get(PRIVACY_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(malformedPrivacySettings);
  }),
  failure: [
    http.get(NOTIFICATIONS_URL, ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      return HttpResponse.json({ detail: 'Notification settings are unavailable.' }, { status: 503 });
    }),
    http.get(PRIVACY_URL, ({ request }) => {
      if (!hasBearerToken(request)) return unauthorizedResponse();
      return HttpResponse.json({ detail: 'Privacy settings are unavailable.' }, { status: 503 });
    }),
  ],
} as const;

export const settingsHandlers = [...settingsHandlerScenarios.success];
