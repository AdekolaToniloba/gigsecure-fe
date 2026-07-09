import { AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPolicyMoney } from '@/components/dashboard/premiums/premiums-formatters';
import { PremiumsOverviewSkeleton } from '@/components/dashboard/premiums/premiums-overview-skeleton';
import type { PolicySummary } from '@/types/policies';

type PremiumsOverviewCardProps = {
  summary?: PolicySummary;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

export function PremiumsOverviewCard({
  summary,
  isLoading = false,
  errorMessage = null,
  onRetry,
}: PremiumsOverviewCardProps) {
  if (isLoading) return <PremiumsOverviewSkeleton />;

  if (errorMessage) {
    return (
      <section
        role="alert"
        aria-labelledby="premiums-overview-error-title"
        className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
            <AlertTriangle aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2
              id="premiums-overview-error-title"
              className="font-heading text-xl font-bold text-primary"
            >
              Protection overview unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{errorMessage}</p>
            {onRetry ? (
              <Button type="button" onClick={onRetry} className="mt-4">
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  const safeSummary = summary ?? {
    total_coverage: '0',
    active_count: 0,
    due_soon_count: 0,
  };

  return (
    <section
      aria-labelledby="premiums-overview-title"
      className="rounded-lg border border-app-border bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-muted text-primary">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2
            id="premiums-overview-title"
            className="font-heading text-xl font-bold text-primary sm:text-2xl"
          >
            Your Protection Overview
          </h2>
          <p className="mt-2 text-sm leading-6 text-primary-light">
            Here&apos;s a quick look at your insurance protection.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid min-w-0 gap-4 sm:grid-cols-3">
        <Metric label="Total Coverage" value={formatPolicyMoney(safeSummary.total_coverage, 'NGN')} />
        <Metric label="Active Plans" value={safeSummary.active_count.toLocaleString('en-NG')} />
        <Metric label="Due Soon" value={safeSummary.due_soon_count.toLocaleString('en-NG')} />
      </dl>
      <p className="sr-only">
        Total coverage is displayed in Nigerian naira because the policy summary contract does not
        include a currency field.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-app-canvas p-4">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-2 break-words font-heading text-2xl font-bold text-primary">{value}</dd>
    </div>
  );
}
