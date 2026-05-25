'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/auth/useSession';
import {
  DEFAULT_AUTHENTICATED_PATH,
  getSafeRedirectPath,
  isPublicOnlyAuthPath,
} from '@/lib/auth/redirects';

export function AuthRedirectGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, status, isInitializing } = useSession();
  const isPublicOnly = isPublicOnlyAuthPath(pathname);

  useEffect(() => {
    if (!isPublicOnly || isInitializing || status === 'idle') return;
    if (!isAuthenticated) return;

    const safeRedirect =
      getSafeRedirectPath(searchParams.get('redirect')) ?? DEFAULT_AUTHENTICATED_PATH;
    router.replace(safeRedirect);
  }, [isAuthenticated, isInitializing, isPublicOnly, pathname, router, searchParams, status]);

  if (isPublicOnly && (isInitializing || status === 'idle' || isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}
