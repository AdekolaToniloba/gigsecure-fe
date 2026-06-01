'use client';

import { Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useMarketplaceRecommendationsGate } from '@/hooks/marketplace/useMarketplaceRecommendationsGate';

export function MarketplaceRecommendationsAction() {
  const {
    requestRecommendations,
    recommendations,
    error,
    hasRequestedRecommendations,
    isCheckingAccess,
    isLoadingRecommendations,
    isRecommendationsReady,
  } = useMarketplaceRecommendationsGate();
  const recommendationCount = recommendations?.items.length ?? 0;

  return (
    <section
      aria-labelledby="marketplace-recommendations-title"
      className="rounded-lg border border-primary/10 bg-white p-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 id="marketplace-recommendations-title" className="font-heading text-base font-bold text-primary">
              Recommended plans
            </h2>
            <p className="mt-1 text-sm leading-6 text-primary-light">
              Find plans matched to your latest risk assessment.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={requestRecommendations}
          isLoading={isLoadingRecommendations}
          disabled={isCheckingAccess}
          aria-describedby="marketplace-recommendations-status"
          className="shrink-0"
        >
          {isLoadingRecommendations
            ? 'Loading recommendations...'
            : error && hasRequestedRecommendations
              ? 'Try Recommendations Again'
              : 'View Recommendations'}
        </Button>
      </div>

      <div
        id="marketplace-recommendations-status"
        className="mt-3"
        aria-live="polite"
        aria-atomic="true"
      >
        {isCheckingAccess ? (
          <p role="status" className="text-sm text-primary-light">
            Checking recommendation access...
          </p>
        ) : null}

        {isLoadingRecommendations ? (
          <p role="status" className="text-sm text-primary-light">
            Loading personalized recommendations...
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error.message}
          </p>
        ) : null}

        {isRecommendationsReady && recommendations ? (
          <p role="status" className="text-sm text-primary-light">
            {recommendationCount === 0
              ? 'No personalized recommendations are available yet.'
              : `${recommendationCount} personalized ${recommendationCount === 1 ? 'plan is' : 'plans are'} ready.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}
