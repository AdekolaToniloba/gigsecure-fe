'use client';

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { PolicyStatusBadge } from '@/components/dashboard/premiums/policy-status-badge';
import { ReportDownloadButton } from '@/components/dashboard/premiums/report-download-button';
import {
  formatPolicyDate,
  formatPolicyMoney,
  formatRenewalFrequency,
} from '@/components/dashboard/premiums/premiums-formatters';
import Button from '@/components/ui/Button';
import { usePolicyDetail } from '@/hooks/policies/usePolicies';
import { parseApiError } from '@/lib/api/errors';
import type { Policy } from '@/types/policies';

type PolicyDetailContentProps = {
  policyId: string | null;
  fallbackPolicy?: Policy | null;
  reportAvailable?: boolean;
};

export function PolicyDetailContent({
  policyId,
  fallbackPolicy = null,
  reportAvailable = false,
}: PolicyDetailContentProps) {
  const detailQuery = usePolicyDetail(policyId);
  const policy = detailQuery.data ?? (
    fallbackPolicy?.id === policyId ? fallbackPolicy : null
  );

  if (!policy && detailQuery.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-center">
        <p role="status" className="text-sm text-primary-light">Loading policy details...</p>
      </div>
    );
  }

  if (!policy && detailQuery.isError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <div className="min-w-0">
            <h3 className="font-heading text-xl font-bold text-primary">Policy details unavailable</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {parseApiError(detailQuery.error).message}
            </p>
            <Button type="button" onClick={() => void detailQuery.refetch()} className="mt-4">
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <p role="status" className="text-sm text-primary-light">
        Select a policy to view details.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-heading text-2xl font-bold text-primary">
            {policy.product.name}
          </h3>
          <p className="mt-1 break-words text-sm leading-6 text-primary-light">
            {policy.product.provider_name} <span aria-hidden="true">•</span>{' '}
            {policy.product.category}
          </p>
        </div>
        <PolicyStatusBadge status={policy.display_status} />
      </div>

      {detailQuery.isFetching && fallbackPolicy ? (
        <p role="status" className="mt-4 text-sm text-primary-light">
          Refreshing policy details...
        </p>
      ) : null}

      <section className="mt-7 rounded-lg border border-primary/10 bg-app-canvas p-5">
        <h4 className="sr-only">Policy amount summary</h4>
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailMetric
            label="Coverage amount"
            value={formatPolicyMoney(policy.coverage_amount, policy.premium_currency)}
          />
          <DetailMetric
            label={`Premium / ${policy.renewal_frequency}`}
            value={formatPolicyMoney(policy.premium_amount, policy.premium_currency)}
          />
        </dl>
      </section>

      <section className="mt-7">
        <h4 className="font-heading text-xl font-bold text-primary">Coverage details</h4>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailRow
            label="Coverage Limit"
            value={formatPolicyMoney(policy.coverage_amount, policy.premium_currency)}
          />
          <DetailRow label="Payout Type" value="Not available" />
        </dl>
      </section>

      <section className="mt-7">
        <h4 className="font-heading text-xl font-bold text-primary">Plan timeline</h4>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <DetailRow label="Start Date" value={formatPolicyDate(policy.start_date)} />
          <DetailRow label="Expire Date" value={formatPolicyDate(policy.end_date)} />
          <DetailRow label="Renews" value={formatRenewalFrequency(policy.renewal_frequency)} />
        </dl>
      </section>

      <section className="mt-7">
        <h4 className="font-heading text-xl font-bold text-primary">Policy and document</h4>
        <p className="mt-2 text-sm leading-6 text-primary-light">
          A policy document link is not available in the current API contract.
        </p>
        <div className="mt-4">
          <ReportDownloadButton policyId={policy.id} isAvailable={reportAvailable} />
        </div>
      </section>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-2 break-words font-heading text-2xl font-bold text-primary">{value}</dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white p-4">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-sm font-semibold text-primary">{value}</dd>
    </div>
  );
}
