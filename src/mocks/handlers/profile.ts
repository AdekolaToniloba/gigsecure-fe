import { delay, http, HttpResponse } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { updateProfileRequestSchema } from '@/lib/validators/user';
import {
  buildUpdatedProfileResponse,
  emptyProfileResponseFixture,
  fullProfileResponseFixture,
  profileValidationErrorFixture,
} from '@/mocks/fixtures/profile';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;

export const PROFILE_LOADING_DELAY_MS = 120;

function hasBearerToken(request: Request) {
  return /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '');
}

function unauthorizedResponse() {
  return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
}

export const profileHandlerScenarios = {
  getEmpty: http.get(PROFILE_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(emptyProfileResponseFixture);
  }),
  getComplete: http.get(PROFILE_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(fullProfileResponseFixture);
  }),
  getMalformed: http.get(PROFILE_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json({
      ...fullProfileResponseFixture,
      user: {
        ...fullProfileResponseFixture.user,
        id: 'not-a-uuid',
      },
    });
  }),
  getDelayed: http.get(PROFILE_URL, async ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    await delay(PROFILE_LOADING_DELAY_MS);
    return HttpResponse.json(fullProfileResponseFixture);
  }),
  updateSuccess: http.put(PROFILE_URL, async ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    const payload = await request.json();
    const parsed = updateProfileRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return HttpResponse.json(profileValidationErrorFixture, { status: 422 });
    }
    return HttpResponse.json(buildUpdatedProfileResponse(parsed.data, emptyProfileResponseFixture));
  }),
  updateValidationError: http.put(PROFILE_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json(profileValidationErrorFixture, { status: 422 });
  }),
  updateMalformed: http.put(PROFILE_URL, ({ request }) => {
    if (!hasBearerToken(request)) return unauthorizedResponse();
    return HttpResponse.json({
      user: {
        ...fullProfileResponseFixture.user,
        id: 'not-a-uuid',
      },
      profile: fullProfileResponseFixture.profile,
      kyc_verified: true,
      risk_assessed: true,
    });
  }),
} as const;

export const profileHandlers = [
  profileHandlerScenarios.getEmpty,
  profileHandlerScenarios.updateSuccess,
];
