import { CalendarDays, RefreshCw, ShieldCheck } from 'lucide-react';
import { PolicyStatusBadge } from '@/components/dashboard/premiums/policy-status-badge';
import { ReportDownloadButton } from '@/components/dashboard/premiums/report-download-button';
import {
  formatPolicyDate,
  formatPolicyMoney,
  formatRenewalFrequency,
  getPrimaryPolicyDate,
} from '@/components/dashboard/premiums/premiums-formatters';
import Button from '@/components/ui/Button';
import type { Policy } from '@/types/policies';

type PolicyCardProps = {
  policy: Policy;
  onViewDetails: (policy: Policy) => void;
  reportAvailable?: boolean;
};

export function PolicyCard({
  policy,
  onViewDetails,
  reportAvailable = false,
}: PolicyCardProps) {
  const primaryDate = getPrimaryPolicyDate(policy);

  return (
    <article className="min-w-0 rounded-lg border border-app-border bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="break-words font-heading text-xl font-bold leading-tight text-primary">
              {policy.product.name}
            </h3>
            <p className="mt-1 break-words text-sm leading-6 text-primary-light">
              {policy.product.provider_name} <span aria-hidden="true">•</span>{' '}
              {policy.product.category}
            </p>
          </div>
        </div>
        <PolicyStatusBadge status={policy.display_status} />
      </div>

      <dl className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 rounded-lg bg-app-canvas p-4">
          <dt className="text-xs font-semibold uppercase text-slate-500">Coverage</dt>
          <dd className="mt-2 break-words font-heading text-xl font-bold text-primary">
            {formatPolicyMoney(policy.coverage_amount, policy.premium_currency)}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg bg-app-canvas p-4">
          <dt className="text-xs font-semibold uppercase text-slate-500">Premium</dt>
          <dd className="mt-2 break-words font-heading text-xl font-bold text-primary">
            {formatPolicyMoney(policy.premium_amount, policy.premium_currency)}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg bg-app-canvas p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {primaryDate.label}
          </dt>
          <dd className="mt-2 text-sm font-semibold text-primary">{primaryDate.value}</dd>
        </div>
        <div className="min-w-0 rounded-lg bg-app-canvas p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Renewal
          </dt>
          <dd className="mt-2 text-sm font-semibold text-primary">
            {formatRenewalFrequency(policy.renewal_frequency)}
          </dd>
        </div>
      </dl>

      <dl className="mt-4 grid gap-3 text-sm text-primary-light sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-primary">Expiry date</dt>
          <dd>{formatPolicyDate(policy.end_date)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-primary">Policy ID</dt>
          <dd className="break-words">{policy.external_policy_id ?? policy.id}</dd>
        </div>
      </dl>

      <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <Button type="button" onClick={() => onViewDetails(policy)} className="w-full sm:w-auto">
          View Details
        </Button>
        <ReportDownloadButton
          policyId={policy.id}
          isAvailable={reportAvailable}
          className="w-full sm:w-auto"
        />
      </div>
    </article>
  );
}
