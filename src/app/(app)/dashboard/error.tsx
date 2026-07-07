'use client';

import { DashboardErrorState } from '@/components/dashboard/overview/dashboard-error-state';

type DashboardRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardRouteError({ reset }: DashboardRouteErrorProps) {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0">
      <DashboardErrorState
        title="Dashboard unavailable"
        message="Something unexpected interrupted your dashboard. Please try loading it again."
        retryLabel="Reload dashboard"
        onRetry={reset}
      />
    </div>
  );
}
