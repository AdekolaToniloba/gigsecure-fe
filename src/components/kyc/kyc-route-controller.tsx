'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/auth/useSession';
import { useKycGate } from '@/hooks/kyc/useKycGate';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { buildLoginRedirect } from '@/lib/auth/redirects';

export function KycRouteController({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, status, isInitializing } = useSession();
  const { hasResolvedFlags, isLoading: areFlagsLoading } = useKycGate();
  const profileQuery = useUserProfile();

  const search = searchParams.toString();
  const searchSuffix = search ? `?${search}` : '';
  const isProfileResolving =
    isAuthenticated && profileQuery.isLoading && !profileQuery.data && !profileQuery.error;
  const isResolving =
    status === 'idle' ||
    isInitializing ||
    (isAuthenticated && (areFlagsLoading || !hasResolvedFlags || isProfileResolving));

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(buildLoginRedirect(pathname, searchSuffix));
      return;
    }

  }, [
    isAuthenticated,
    isResolving,
    pathname,
    router,
    searchSuffix,
  ]);

  if (isResolving || !isAuthenticated) {
    return (
      <div role="status" aria-live="polite" className="mx-auto max-w-3xl text-sm text-primary">
        Checking your verification status...
      </div>
    );
  }

  return <>{children}</>;
}
