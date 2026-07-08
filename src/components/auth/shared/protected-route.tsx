'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/auth/useSession';
import { buildLoginRedirect, isProtectedAppPath } from '@/lib/auth/redirects';

type ProtectedRouteProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ProtectedRoute({ children, fallback = null }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasFullSession, status, isInitializing } = useSession();
  const isProtectedPath = isProtectedAppPath(pathname);

  const search = searchParams.toString();
  const searchSuffix = search ? `?${search}` : '';

  useEffect(() => {
    if (!isProtectedPath || isInitializing || status === 'idle') return;
    if (hasFullSession) return;

    router.replace(buildLoginRedirect(pathname, searchSuffix));
  }, [
    hasFullSession,
    isInitializing,
    isProtectedPath,
    pathname,
    router,
    searchSuffix,
    status,
  ]);

  if (isProtectedPath && (isInitializing || status === 'idle')) {
    return <>{fallback}</>;
  }

  if (isProtectedPath && !hasFullSession) {
    return null;
  }

  return <>{children}</>;
}
