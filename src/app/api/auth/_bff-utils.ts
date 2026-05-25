import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const COOKIE_NAME = 'gs_refresh_token';
const COOKIE_PATH = '/';
const LEGACY_COOKIE_PATH = '/api/auth/refresh';
const IS_PROD = process.env.NODE_ENV === 'production';

/** Shared CSRF check — all state-changing BFF routes use this */
export function assertCsrfHeader(req: NextRequest): NextResponse | null {
  const xrw = req.headers.get('X-Requested-With');
  if (xrw !== 'XMLHttpRequest') {
    return NextResponse.json({ detail: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { detail: text || res.statusText };
  }
}

export function missingBackendUrlResponse(): NextResponse {
  return NextResponse.json(
    { detail: 'Backend API URL is not configured.' },
    { status: 500 }
  );
}

/** Serialize the refresh_token into a secure httpOnly cookie string */
export function buildRefreshCookie(token: string): string {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  return [
    `${COOKIE_NAME}=${token}`,
    `Path=${COOKIE_PATH}`,
    `Max-Age=${maxAge}`,
    `HttpOnly`,
    `SameSite=Strict`,
    IS_PROD ? `Secure` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

/** Clear the refresh cookie */
export function clearRefreshCookie(path = COOKIE_PATH): string {
  return [
    `${COOKIE_NAME}=`,
    `Path=${path}`,
    `Max-Age=0`,
    `HttpOnly`,
    `SameSite=Strict`,
    IS_PROD ? `Secure` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearLegacyRefreshCookie(): string {
  return clearRefreshCookie(LEGACY_COOKIE_PATH);
}

export function createBrowserSessionResponse(
  data: unknown,
  options: {
    status?: number;
    requireRefreshToken?: boolean;
  } = {}
): NextResponse {
  const tokenData = data as {
    access_token?: unknown;
    refresh_token?: unknown;
    token_type?: unknown;
  };

  if (typeof tokenData.access_token !== 'string') {
    return NextResponse.json(
      { detail: 'Backend response did not include an access token.' },
      { status: 502 }
    );
  }

  if (options.requireRefreshToken && typeof tokenData.refresh_token !== 'string') {
    return NextResponse.json(
      { detail: 'Backend response did not include a refresh token.' },
      { status: 502 }
    );
  }

  const response = NextResponse.json(
    {
      access_token: tokenData.access_token,
      token_type:
        typeof tokenData.token_type === 'string' ? tokenData.token_type : 'bearer',
    },
    { status: options.status ?? 200 }
  );

  if (typeof tokenData.refresh_token === 'string') {
    response.headers.set('Set-Cookie', buildRefreshCookie(tokenData.refresh_token));
  }

  return response;
}

export function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization;
}

export { BACKEND_URL };
