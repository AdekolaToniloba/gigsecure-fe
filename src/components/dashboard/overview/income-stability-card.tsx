import Link from 'next/link';
import { Activity, ChartNoAxesCombined } from 'lucide-react';
import { useId } from 'react';
import { DashboardEmptyState } from '@/components/dashboard/overview/dashboard-empty-state';
import { IncomeStabilityChart } from '@/components/dashboard/overview/income-stability-chart';
import { IncomeStabilityTable } from '@/components/dashboard/overview/income-stability-table';
import { formatScoreSummary } from '@/lib/dashboard/formatters';
import { cn } from '@/lib/utils';
import type { IncomeStabilityPattern } from '@/types/dashboard';

type IncomeStabilityCardProps = {
  stability: IncomeStabilityPattern | null;
  className?: string;
};

export function IncomeStabilityCard({ stability, className }: IncomeStabilityCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'min-w-0 overflow-hidden rounded-xl border border-app-border bg-white p-5 shadow-sm sm:p-7',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary"
        >
          <Activity className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2
            id={titleId}
            className="font-heading text-xl font-bold leading-tight text-primary sm:text-2xl"
          >
            Income Stability Pattern
          </h2>
          <p className="mt-1 text-sm leading-6 text-primary-light">
            Your validated assessment trend, shown without assumed units.
          </p>
        </div>
      </div>

      {stability === null ? (
        <div className="relative mt-6 min-w-0 overflow-hidden rounded-xl">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-app-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-app-border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40"
          />
          <DashboardEmptyState
            title="No stability data yet"
            message="Complete your risk assessment before an income stability pattern can be shown."
            icon={<ChartNoAxesCombined aria-hidden="true" className="h-6 w-6" />}
            action={(
              <Link
                href="/dashboard/risk-assessment"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Start assessment
              </Link>
            )}
          />
        </div>
      ) : (
        <div className="mt-6 min-w-0">
          <p className="inline-flex max-w-full break-words rounded-full bg-primary-muted px-4 py-2 text-sm font-semibold text-primary [overflow-wrap:anywhere]">
            {formatScoreSummary(stability.classification, stability.score)}
          </p>

          {stability.graph_points.length > 0 ? (
            <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-app-border bg-app-canvas p-2 sm:p-4">
              <IncomeStabilityChart points={stability.graph_points} />
            </div>
          ) : (
            <div role="status" className="mt-5 rounded-xl border border-dashed border-app-border p-6 text-center text-sm text-slate-600">
              No trend observations are available for this assessment.
            </div>
          )}

          <details className="mt-5 min-w-0">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              View trend values
            </summary>
            <IncomeStabilityTable points={stability.graph_points} />
          </details>
        </div>
      )}
    </section>
  );
}
