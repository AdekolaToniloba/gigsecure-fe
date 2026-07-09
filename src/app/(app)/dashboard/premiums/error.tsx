'use client';

import { DashboardErrorState } from '@/components/dashboard/overview/dashboard-error-state';

type DashboardPremiumsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardPremiumsError({ reset }: DashboardPremiumsErrorProps) {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0">
      <DashboardErrorState
        title="Premiums unavailable"
        message="Something unexpected interrupted your premiums page. Please try loading it again."
        retryLabel="Reload premiums"
        onRetry={reset}
      />
    </div>
  );
}
