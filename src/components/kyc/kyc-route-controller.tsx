'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/hooks/auth/useSession';
import { useKycGate } from '@/hooks/kyc/useKycGate';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { buildLoginRedirect } from '@/lib/auth/redirects';

export function KycRouteController({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasFullSession, status, isInitializing } = useSession();
  const { hasResolvedFlags, isLoading: areFlagsLoading } = useKycGate();
  const profileQuery = useUserProfile({ enabled: hasFullSession });

  const search = searchParams.toString();
  const searchSuffix = search ? `?${search}` : '';
  const isProfileResolving =
    hasFullSession && profileQuery.isLoading && !profileQuery.data && !profileQuery.error;
  const isResolving =
    status === 'idle' ||
    isInitializing ||
    (hasFullSession && (areFlagsLoading || !hasResolvedFlags || isProfileResolving));

  useEffect(() => {
    if (isResolving) return;

    if (!hasFullSession) {
      router.replace(buildLoginRedirect(pathname, searchSuffix));
      return;
    }

  }, [
    hasFullSession,
    isResolving,
    pathname,
    router,
    searchSuffix,
  ]);

  if (isResolving || !hasFullSession) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex max-w-3xl items-center gap-3 rounded-lg border border-primary-muted bg-primary-muted p-4 text-sm text-primary"
      >
        <Loader2 aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin" />
        <span>Checking your verification status...</span>
      </div>
    );
  }

  return <>{children}</>;
}
