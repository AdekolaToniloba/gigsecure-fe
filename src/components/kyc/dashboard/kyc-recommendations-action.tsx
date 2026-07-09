'use client';

import { useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { KycRequiredModal } from '@/components/kyc/shared/kyc-required-modal';
import { parseApiError } from '@/lib/api/errors';
import { riskService } from '@/services/risk.service';

import { useKycGate } from '@/hooks/kyc/useKycGate';

export function KycRecommendationsAction() {
  const { canProceed, isLoading: isCheckingFlags } = useKycGate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const recommendations = useMutation({
    mutationFn: () => riskService.getRecommendations(),
    retry: false,
  });

  const parsedError = recommendations.error ? parseApiError(recommendations.error) : null;

  function handleClick() {
    if (isCheckingFlags) return;

    if (!canProceed) {
      setIsModalOpen(true);
      return;
    }

    recommendations.mutate();
  }

  return (
    <section
      aria-labelledby="dashboard-recommendations-title"
      className="mb-8 rounded-lg border border-primary/10 bg-white/70 p-5 shadow-sm backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 id="dashboard-recommendations-title" className="font-heading text-lg font-bold text-primary">
              Coverage recommendations
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-light">
              Review your personalized coverage plan based on your latest risk profile.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleClick}
          isLoading={recommendations.isPending}
          disabled={isCheckingFlags}
          aria-describedby="dashboard-recommendations-status"
          className="shrink-0"
        >
          {recommendations.isPending ? 'Loading plan...' : 'View Recommendations'}
        </Button>
      </div>

      <div id="dashboard-recommendations-status" className="mt-4" aria-live="polite" aria-atomic="true">
        {isCheckingFlags ? (
          <p role="status" className="text-sm text-primary-light">
            Checking verification status...
          </p>
        ) : null}

        {recommendations.isPending ? (
          <p role="status" className="text-sm text-primary-light">
            Loading recommendations...
          </p>
        ) : null}

        {parsedError ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {parsedError.message || 'We could not load recommendations right now. Please try again.'}
          </p>
        ) : null}

        {recommendations.isSuccess ? (
          recommendations.data.recommendations.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {recommendations.data.recommendations.map((recommendation, index) => (
                <li
                  key={`${index}-${recommendation}`}
                  className="rounded-lg border border-primary/10 bg-white px-4 py-3 text-sm text-primary-light"
                >
                  {recommendation}
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="text-sm text-primary-light">
              No recommendations are available yet.
            </p>
          )
        ) : null}
      </div>

      <KycRequiredModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="KYC verification required"
        description="Complete KYC verification before viewing your coverage recommendations."
        ctaLabel="Go to KYC"
        returnTo="/dashboard"
      />
    </section>
  );
}
