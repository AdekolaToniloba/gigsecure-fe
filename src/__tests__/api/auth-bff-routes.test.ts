import { NextRequest, type NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as activatePost } from '@/app/api/auth/activate/route';
import { PUT as changePasswordPut } from '@/app/api/auth/change-password/route';
import { POST as forgotPasswordPost } from '@/app/api/auth/forgot-password/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { POST as refreshPost } from '@/app/api/auth/refresh/route';
import { POST as registerPost } from '@/app/api/auth/register/route';
import { POST as resendActivationPost } from '@/app/api/auth/resend-activation/route';
import { POST as resetPasswordPost } from '@/app/api/auth/reset-password/route';
import { POST as verifyEmailPost } from '@/app/api/auth/verify-email/route';
import { POST as waitlistPost } from '@/app/api/auth/waitlist/route';

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

describe('auth BFF routes', () => {
  it.each([
    ['activate account', activatePost, 'POST'],
    ['change password', changePasswordPut, 'PUT'],
    ['forgot password', forgotPasswordPost, 'POST'],
    ['login', loginPost, 'POST'],
    ['logout', logoutPost, 'POST'],
    ['refresh', refreshPost, 'POST'],
    ['register', registerPost, 'POST'],
    ['resend activation', resendActivationPost, 'POST'],
    ['reset password', resetPasswordPost, 'POST'],
    ['verify email', verifyEmailPost, 'POST'],
    ['waitlist signup', waitlistPost, 'POST'],
  ] satisfies Array<[string, RouteHandler, string]>)(
    'rejects %s requests without the XMLHttpRequest CSRF header',
    async (_name, handler, method) => {
      const response = await handler(createRequest({ method }));

      await expect(response.json()).resolves.toEqual({ detail: 'Forbidden' });
      expect(response.status).toBe(403);
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it('keeps register unauthenticated and does not set a refresh cookie', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        message: 'Registration successful. Please check your email to verify your account.',
      }, { status: 201 })
    );

    const response = await registerPost(
      createRequest({
        method: 'POST',
        body: {
          email: 'amaka@example.com',
          password: 'SecurePass123',
          first_name: 'Amaka',
          last_name: 'Obi',
        },
        withCsrf: true,
      })
    );

    await expect(response.json()).resolves.toEqual({
      message: 'Registration successful. Please check your email to verify your account.',
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('stores login refresh tokens in httpOnly cookies without returning them to browser JavaScript', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'bearer',
        kyc_verified: false,
        risk_assessed: true,
      })
    );

    const response = await loginPost(
      createRequest({
        method: 'POST',
        body: {
          email: 'amaka@example.com',
          password: 'SecurePass123',
        },
        withCsrf: true,
      })
    );

    await expect(response.json()).resolves.toEqual({
      access_token: 'access-token',
      token_type: 'bearer',
      kyc_verified: false,
      risk_assessed: true,
    });
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('gs_refresh_token=refresh-token')
    );
    expect(response.headers.get('set-cookie')).toEqual(expect.stringContaining('HttpOnly'));
    expect(response.headers.get('set-cookie')).toEqual(expect.stringContaining('SameSite=Strict'));
  });

  it('refreshes from the httpOnly cookie and tolerates non-rotating backend responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        access_token: 'fresh-access-token',
        token_type: 'bearer',
        kyc_verified: true,
        risk_assessed: true,
      })
    );

    const response = await refreshPost(
      createRequest({
        method: 'POST',
        withCsrf: true,
        cookie: 'gs_refresh_token=refresh-token',
      })
    );

    await expect(response.json()).resolves.toEqual({
      access_token: 'fresh-access-token',
      token_type: 'bearer',
      kyc_verified: true,
      risk_assessed: true,
    });
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: 'refresh-token' }),
    });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('defaults missing login flags to false while keeping refresh tokens cookie-only', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      })
    );

    const response = await loginPost(
      createRequest({
        method: 'POST',
        body: {
          email: 'amaka@example.com',
          password: 'SecurePass123',
        },
        withCsrf: true,
      })
    );

    await expect(response.json()).resolves.toEqual({
      access_token: 'access-token',
      token_type: 'bearer',
      kyc_verified: false,
      risk_assessed: false,
    });
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('gs_refresh_token=refresh-token')
    );
  });

  it('expires current and legacy refresh cookie paths on logout', async () => {
    const response = await logoutPost(
      createRequest({
        method: 'POST',
        withCsrf: true,
      })
    );
    const setCookies = getSetCookies(response);

    await expect(response.json()).resolves.toEqual({ message: 'Logged out successfully' });
    expect(setCookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Path=/'),
        expect.stringContaining('Path=/api/auth/refresh'),
      ])
    );
    expect(setCookies.join('\n')).toContain('Max-Age=0');
  });
});

function createRequest({
  method,
  body,
  withCsrf = false,
  cookie,
}: {
  method: string;
  body?: unknown;
  withCsrf?: boolean;
  cookie?: string;
}) {
  const headers = new Headers();
  if (withCsrf) headers.set('X-Requested-With', 'XMLHttpRequest');
  if (cookie) headers.set('Cookie', cookie);
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  return new NextRequest('http://localhost/api/auth/test', {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getSetCookies(response: NextResponse) {
  return (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie();
}
