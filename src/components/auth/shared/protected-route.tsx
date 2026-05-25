'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/auth/useSession';
import { buildLoginRedirect, isProtectedAppPath } from '@/lib/auth/redirects';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, status, isInitializing } = useSession();
  const isProtectedPath = isProtectedAppPath(pathname);

  const search = searchParams.toString();
  const searchSuffix = search ? `?${search}` : '';

  useEffect(() => {
    if (!isProtectedPath || isInitializing || status === 'idle') return;
    if (isAuthenticated) return;

    router.replace(buildLoginRedirect(pathname, searchSuffix));
  }, [
    isAuthenticated,
    isInitializing,
    isProtectedPath,
    pathname,
    router,
    searchSuffix,
    status,
  ]);

  if (isProtectedPath && (isInitializing || status === 'idle' || !isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}
