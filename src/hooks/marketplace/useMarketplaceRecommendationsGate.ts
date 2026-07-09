'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/hooks/auth/useSession';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import { useMarketplaceRecommendations } from '@/hooks/marketplace/useMarketplace';
import { parseApiError } from '@/lib/api/errors';
import { buildLoginRedirect } from '@/lib/auth/redirects';

export function useMarketplaceRecommendationsGate(perCategory = 3) {
  const router = useRouter();
  const { hasFullSession, isInitializing } = useSession();
  const { isRiskAssessed, isLoading: areFlagsLoading } = useUserFlags();
  const [hasRequestedRecommendations, setHasRequestedRecommendations] = useState(false);
  const isCheckingAccess = isInitializing || areFlagsLoading;
  const canLoadRecommendations = hasFullSession && isRiskAssessed;
  const recommendations = useMarketplaceRecommendations(
    perCategory,
    hasRequestedRecommendations && canLoadRecommendations
  );
  const error = recommendations.error ? parseApiError(recommendations.error) : null;

  function requestRecommendations() {
    if (isCheckingAccess) return;

    if (!hasFullSession) {
      router.push(buildLoginRedirect('/marketplace'));
      return;
    }

    if (!isRiskAssessed) {
      router.push('/dashboard/risk-assessment');
      return;
    }

    if (hasRequestedRecommendations) {
      void recommendations.refetch();
      return;
    }

    setHasRequestedRecommendations(true);
  }

  return {
    requestRecommendations,
    recommendations: recommendations.data,
    error,
    hasRequestedRecommendations,
    isCheckingAccess,
    isLoadingRecommendations: recommendations.isFetching,
    isRecommendationsReady: recommendations.isSuccess,
  };
}
