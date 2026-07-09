import { delay, http, HttpResponse } from 'msw';
import { waitlistSignupRequestSchema } from '@/lib/validators/auth';
import {
  riskErrorFixtures,
  waitlistSignupFixture,
} from '@/mocks/fixtures/risk-assessment';

const mockTokenResponse = {
  access_token: 'mock-access-token-12345',
  token_type: 'bearer',
  kyc_verified: false,
  risk_assessed: true,
};

export const WAITLIST_LOADING_DELAY_MS = 120;

function waitlistSuccessHandler() {
  return http.post('/api/auth/waitlist', async ({ request }) => {
    const payload = await request.json().catch(() => null);
    if (!waitlistSignupRequestSchema.safeParse(payload).success) {
      return HttpResponse.json(
        {
          detail: [
            {
              loc: ['body', 'email'],
              msg: 'A valid email address is required',
              type: 'value_error.email',
            },
          ],
        },
        { status: 422 }
      );
    }
    return HttpResponse.json(waitlistSignupFixture);
  });
}

export const waitlistHandlerScenarios = {
  success: waitlistSuccessHandler(),
  failure: http.post('/api/auth/waitlist', () =>
    HttpResponse.json(riskErrorFixtures.server, { status: 500 })
  ),
  delayed: http.post('/api/auth/waitlist', async () => {
    await delay(WAITLIST_LOADING_DELAY_MS);
    return HttpResponse.json(waitlistSignupFixture);
  }),
} as const;

export const authHandlers = [
  // BFF login (intercepted at Next.js layer)
  http.post('/api/auth/login', () =>
    HttpResponse.json(mockTokenResponse)
  ),

  http.post('/api/auth/register', () =>
    HttpResponse.json(
      {
        message:
          'Registration successful. Please check your email to verify your account.',
      },
      { status: 201 }
    )
  ),

  http.post('/api/auth/refresh', () =>
    HttpResponse.json(mockTokenResponse)
  ),

  http.post('/api/auth/logout', () =>
    HttpResponse.json({ message: 'Logged out successfully' })
  ),

  waitlistHandlerScenarios.success,

  http.post('/api/auth/verify-email', () =>
    HttpResponse.json(mockTokenResponse)
  ),

  http.post('/api/auth/activate', () =>
    HttpResponse.json(mockTokenResponse)
  ),

  http.post('/api/auth/forgot-password', () =>
    HttpResponse.json({ message: 'Reset email sent' })
  ),

  http.post('/api/auth/reset-password', () =>
    HttpResponse.json({ message: 'Password reset successful' })
  ),

  http.post('/api/auth/resend-activation', () =>
    HttpResponse.json({
      message: 'If the email is registered, an activation link has been sent.',
    })
  ),

  http.put('/api/auth/change-password', () =>
    HttpResponse.json({ message: 'Password changed successfully' })
  ),
];
