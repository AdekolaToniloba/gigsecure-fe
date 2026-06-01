import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_AUTHENTICATED_PATH,
  DEFAULT_UNAUTHENTICATED_PATH,
  buildLoginRedirect,
  getSafeRedirectPath,
  isProtectedAppPath,
  isPublicOnlyAuthPath,
} from '@/lib/auth/redirects';

const COOKIE_NAME = 'gs_refresh_token';

const ALWAYS_ACCESSIBLE = ['/api/', '/_next/', '/favicon.ico', '/logo.png', '/assets/'];

function isAlwaysAccessible(path: string): boolean {
  return ALWAYS_ACCESSIBLE.some((prefix) => path.startsWith(prefix));
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasRefreshCookie = req.cookies.has(COOKIE_NAME);

  // Static assets, Next.js internals — pass through
  // Note: /api/ is allowed above so our /api/staging-auth route is accessible!
  if (isAlwaysAccessible(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  const host = req.headers.get('host') || '';

  // === STAGING SUBDOMAIN PROTECTION ===
  if (host === 'staging.gigsecure.co' || host.startsWith('staging.')) {
    const isStagingAuth = req.cookies.has('gs_staging_auth');

    if (pathname === '/staging-login') {
      if (isStagingAuth) {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return applySecurityHeaders(NextResponse.redirect(url));
      }
      return applySecurityHeaders(NextResponse.next());
    }

    if (!isStagingAuth) {
      const url = req.nextUrl.clone();
      url.pathname = '/staging-login';
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }
  // ====================================

  // If logged in and trying to access public-only pages, send them into the app.
  if (isPublicOnlyAuthPath(pathname)) {
    if (hasRefreshCookie) {
      const url = req.nextUrl.clone();
      url.pathname = getSafeRedirectPath(req.nextUrl.searchParams.get('redirect')) ?? DEFAULT_AUTHENTICATED_PATH;
      url.search = '';
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // Protected app routes can only use the refresh cookie as a server-side session hint.
  if (isProtectedAppPath(pathname)) {
    if (!hasRefreshCookie) {
      const url = req.nextUrl.clone();
      url.pathname = DEFAULT_UNAUTHENTICATED_PATH;
      url.search = buildLoginRedirect(pathname, req.nextUrl.search).replace(
        DEFAULT_UNAUTHENTICATED_PATH,
        ''
      );
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
