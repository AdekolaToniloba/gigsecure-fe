import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'gs_refresh_token';

// Paths always accessible — never redirect these
const PUBLIC_ONLY_PATHS = ['/login', '/signup', '/register'];
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

  // If logged in and trying to access public-only pages → redirect to dashboard
  if (PUBLIC_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (hasRefreshCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // Protected (app) routes — require refresh cookie
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    if (!hasRefreshCookie) {
      const url = req.nextUrl.clone();
      const redirect = encodeURIComponent(pathname + req.nextUrl.search);
      url.pathname = '/login';
      url.search = `?redirect=${redirect}`;
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
