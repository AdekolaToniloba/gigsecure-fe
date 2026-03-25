import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COOKIE_NAME = 'gs_refresh_token';
const IS_PROD = process.env.NODE_ENV === 'production';

/** Shared CSRF check — all state-changing BFF routes use this */
export function assertCsrfHeader(req: NextRequest): NextResponse | null {
  const xrw = req.headers.get('X-Requested-With');
  if (xrw !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/** Serialize the refresh_token into a secure httpOnly cookie string */
export function buildRefreshCookie(token: string): string {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  return [
    `${COOKIE_NAME}=${token}`,
    `Path=/api/auth/refresh`,
    `Max-Age=${maxAge}`,
    `HttpOnly`,
    `SameSite=Strict`,
    IS_PROD ? `Secure` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

/** Clear the refresh cookie */
export function clearRefreshCookie(): string {
  return [
    `${COOKIE_NAME}=`,
    `Path=/api/auth/refresh`,
    `Max-Age=0`,
    `HttpOnly`,
    `SameSite=Strict`,
    IS_PROD ? `Secure` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export { BACKEND_URL };
