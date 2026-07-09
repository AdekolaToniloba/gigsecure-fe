import Link from 'next/link';
import { CompletionBadge } from './completion-badge';

type RiskSectionRow = {
  label: string;
  value: string;
  unavailable?: boolean;
};

type RiskSectionCardProps = {
  title: string;
  subtitle: string;
  rows: RiskSectionRow[];
  actionLabel?: string;
  actionHref?: string;
};

export function RiskSectionCard({
  title,
  subtitle,
  rows,
  actionLabel,
  actionHref,
}: RiskSectionCardProps) {
  const hasUnavailableRows = rows.some((row) => row.unavailable);

  return (
    <article className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-bold text-primary">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-primary-light">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <CompletionBadge complete={!hasUnavailableRows} />
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 flex-col gap-1 border-b border-app-border/70 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="text-sm font-medium text-primary-light">{row.label}</dt>
            <dd className={row.unavailable ? 'text-sm text-slate-500' : 'text-sm text-slate-900 [overflow-wrap:anywhere]'}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
