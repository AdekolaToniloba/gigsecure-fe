import { http, HttpResponse } from 'msw';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
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
};

export const authHandlers = [
  // BFF login (intercepted at Next.js layer)
  http.post('/api/auth/login', () =>
    HttpResponse.json(mockTokenResponse)
  ),

  http.post('/api/auth/register', () =>
    HttpResponse.json(mockTokenResponse, { status: 201 })
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

  // Backend auth endpoints
  http.post(`${BASE}/api/v1/auth/verify-email`, () =>
    HttpResponse.json({ message: 'Email verified' })
  ),

  http.post(`${BASE}/api/v1/auth/forgot-password`, () =>
    HttpResponse.json({ message: 'Reset email sent' })
  ),

  http.post(`${BASE}/api/v1/auth/reset-password`, () =>
    HttpResponse.json({ message: 'Password reset successful' })
  ),

  // User
  http.get(`${BASE}/api/v1/users/me`, () =>
    HttpResponse.json({ user: mockUser, profile: null })
  ),

  http.put(`${BASE}/api/v1/users/me`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ user: mockUser, profile: body });
  }),
];
