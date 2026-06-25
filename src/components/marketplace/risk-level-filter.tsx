'use client';

import { useMarketplaceFilters } from '@/hooks/marketplace/useMarketplaceFilters';

const RISK_LEVELS = [
  { label: 'All', value: undefined },
  { label: 'Low Risk', value: 'low' },
  { label: 'Moderate Risk', value: 'moderate' },
  { label: 'High Risk', value: 'high' },
] as const;

export function RiskLevelFilter() {
  const { filters, updateRiskLevel } = useMarketplaceFilters();
  const activeRiskLevel = filters.risk_level?.[0];

  return (
    <div
      aria-label="Filter plans by risk level"
      className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:gap-4 sm:overflow-visible sm:pb-0"
      role="group"
    >
      {RISK_LEVELS.map(({ label, value }) => {
        const isActive = activeRiskLevel === value || (!activeRiskLevel && value === undefined);

        return (
          <button
            key={label}
            type="button"
            aria-pressed={isActive}
            onClick={() => updateRiskLevel(value)}
            className={`h-10 min-w-28 shrink-0 rounded-md border px-4 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-w-32 sm:px-5 ${
              isActive
                ? 'border-accent-alt bg-accent text-primary'
                : 'border-primary/20 bg-white text-primary hover:bg-primary-muted'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
