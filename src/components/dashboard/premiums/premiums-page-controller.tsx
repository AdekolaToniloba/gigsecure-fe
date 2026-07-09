'use client';

import { useState } from 'react';
import { PolicyDetailPanel } from '@/components/dashboard/premiums/policy-detail-panel';
import { PremiumsList } from '@/components/dashboard/premiums/premiums-list';
import { PremiumsOverviewCard } from '@/components/dashboard/premiums/premiums-overview-card';
import { usePolicySummary } from '@/hooks/policies/usePolicies';
import { parseApiError } from '@/lib/api/errors';
import type { Policy } from '@/types/policies';

export function PremiumsPageController() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const summaryQuery = usePolicySummary();

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      <header className="min-w-0">
        <h1 className="text-balance font-heading text-[2rem] font-bold leading-tight text-primary">
          Premiums Bought
        </h1>
        <p className="mt-1 break-words text-base leading-6 text-primary-light [overflow-wrap:anywhere] sm:text-lg">
          Manage your Active protection and upcoming payments.
        </p>
      </header>

      <PremiumsOverviewCard
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        errorMessage={summaryQuery.isError ? parseApiError(summaryQuery.error).message : null}
        onRetry={() => void summaryQuery.refetch()}
      />

      <PremiumsList
        onViewDetails={setSelectedPolicy}
        reportAvailable={false}
      />

      <PolicyDetailPanel
        selectedPolicy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        reportAvailable={false}
      />
    </div>
  );
}
