'use client';

import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PolicyCard } from '@/components/dashboard/premiums/policy-card';
import { PolicyFilterChips } from '@/components/dashboard/premiums/policy-filter-chips';
import { PremiumsEmptyState } from '@/components/dashboard/premiums/premiums-empty-state';
import { PremiumsListSkeleton } from '@/components/dashboard/premiums/premiums-list-skeleton';
import Button from '@/components/ui/Button';
import { usePoliciesList } from '@/hooks/policies/usePolicies';
import { parseApiError } from '@/lib/api/errors';
import type { Policy, PolicyStatusFilter, PremiumsFilter } from '@/types/policies';

type PremiumsListProps = {
  onViewDetails: (policy: Policy) => void;
  reportAvailable?: boolean;
};

const EMPTY_POLICIES: Policy[] = [];

function statusFilterForUiFilter(filter: PremiumsFilter): PolicyStatusFilter | null {
  if (filter === 'active') return 'active';
  if (filter === 'expired') return 'expired';
  return null;
}

function isDueSoon(policy: Policy) {
  return policy.display_status.toLowerCase().includes('due soon');
}

function filterPolicies(filter: PremiumsFilter, policies: Policy[]) {
  if (filter === 'due-soon') return policies.filter(isDueSoon);
  return policies;
}

export function PremiumsList({ onViewDetails, reportAvailable = false }: PremiumsListProps) {
  const [selectedFilter, setSelectedFilter] = useState<PremiumsFilter>('all');
  const statusFilter = statusFilterForUiFilter(selectedFilter);
  const policiesQuery = usePoliciesList(statusFilter);
  const policies = policiesQuery.data?.items ?? EMPTY_POLICIES;
  const visiblePolicies = useMemo(
    () => filterPolicies(selectedFilter, policies),
    [policies, selectedFilter],
  );

  return (
    <section aria-labelledby="premiums-list-title" className="min-w-0">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="premiums-list-title" className="font-heading text-2xl font-bold text-primary">
          Premiums
        </h2>
        <PolicyFilterChips selected={selectedFilter} onChange={setSelectedFilter} />
      </div>

      <div className="mt-5 min-w-0">
        {policiesQuery.isLoading ? <PremiumsListSkeleton /> : null}

        {policiesQuery.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-white p-6 shadow-sm"
          >
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div className="min-w-0">
                <h3 className="font-heading text-xl font-bold text-primary">Premiums unavailable</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {parseApiError(policiesQuery.error).message}
                </p>
                <Button type="button" onClick={() => void policiesQuery.refetch()} className="mt-4">
                  Try again
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {policiesQuery.isSuccess && selectedFilter === 'all' && policies.length === 0 ? (
          <PremiumsEmptyState />
        ) : null}

        {policiesQuery.isSuccess && selectedFilter !== 'all' && visiblePolicies.length === 0 ? (
          <div className="rounded-lg border border-app-border bg-white p-6 text-center shadow-sm">
            <h3 className="font-heading text-xl font-bold text-primary">No premiums match this filter</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-primary-light">
              Try a different status filter to see more of your protection plans.
            </p>
          </div>
        ) : null}

        {policiesQuery.isSuccess && visiblePolicies.length > 0 ? (
          <div className="space-y-4">
            {visiblePolicies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onViewDetails={onViewDetails}
                reportAvailable={reportAvailable}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
