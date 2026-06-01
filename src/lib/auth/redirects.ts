export const DEFAULT_AUTHENTICATED_PATH = '/dashboard';
export const DEFAULT_UNAUTHENTICATED_PATH = '/login';

export const PUBLIC_ONLY_AUTH_PATHS = ['/login', '/register', '/signup'] as const;
export const AUTH_LINK_PATHS = [
  '/check-inbox',
  '/verify-email',
  '/activate',
  '/forgot-password',
  '/reset-password',
] as const;
export const PROTECTED_APP_PATHS = ['/dashboard', '/app', '/change-password', '/kyc'] as const;

export function isPathMatch(pathname: string, paths: readonly string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isPublicOnlyAuthPath(pathname: string) {
  return isPathMatch(pathname, PUBLIC_ONLY_AUTH_PATHS);
}

export function isProtectedAppPath(pathname: string) {
  return isPathMatch(pathname, PROTECTED_APP_PATHS);
}

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
    if (decoded.startsWith('/api/') || decoded.startsWith('/_next/')) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function buildLoginRedirect(pathname: string, search = '') {
  const redirectTarget = `${pathname}${search}`;
  return `${DEFAULT_UNAUTHENTICATED_PATH}?redirect=${encodeURIComponent(redirectTarget)}`;
}
