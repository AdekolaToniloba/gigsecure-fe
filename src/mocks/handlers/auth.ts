import { http, HttpResponse } from 'msw';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'test@gigsecure.com',
  first_name: 'Test',
  last_name: 'User',
  status: 'active',
  email_verified: true,
  phone_number: null,
  last_login_at: null,
  created_at: new Date().toISOString(),
};

const mockTokenResponse = {
  access_token: 'mock-access-token-12345',
  token_type: 'bearer',
  kyc_verified: false,
  risk_assessed: true,
};

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

  http.post('/api/auth/waitlist', () =>
    HttpResponse.json({
      message: 'Added to waitlist',
      user_id: mockUser.id,
      access_token: 'mock-waitlist-token',
      token_type: 'bearer',
    })
  ),

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

  // User
  http.get(`${BASE}/api/v1/users/me`, () =>
    HttpResponse.json({
      user: mockUser,
      profile: null,
      kyc_verified: false,
      risk_assessed: true,
    })
  ),

  http.put(`${BASE}/api/v1/users/me`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: mockUser,
      profile: body,
      kyc_verified: false,
      risk_assessed: true,
    });
  }),
];
