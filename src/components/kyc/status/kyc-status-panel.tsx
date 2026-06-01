'use client';

import { CheckCircle2, CircleDashed, Info, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { KycPendingState } from '@/components/kyc/status/kyc-pending-state';
import { KycRetryPanel } from '@/components/kyc/status/kyc-retry-panel';
import { usePollingKycStatus } from '@/hooks/kyc/useKyc';
import type { KycStatus } from '@/types/kyc';

const RETRY_COOLDOWN_MS = 60 * 60 * 1000;

function isRetryableStatus(status: KycStatus | undefined): status is 'rejected' | 'failed' {
  return status === 'rejected' || status === 'failed';
}

export function KycStatusPanel({ onRetry }: { onRetry?: () => void }) {
  const statusQuery = usePollingKycStatus();
  const status = statusQuery.data?.status;
  const [retryState, setRetryState] = useState<{
    status: 'rejected' | 'failed' | null;
    elapsedMs: number;
  }>({ status: null, elapsedMs: 0 });

  useEffect(() => {
    if (!isRetryableStatus(status)) return;

    const interval = window.setInterval(() => {
      setRetryState((current) => ({
        status,
        elapsedMs:
          current.status === status
            ? Math.min(current.elapsedMs + 1000, RETRY_COOLDOWN_MS)
            : 1000,
      }));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  const retryCooldownRemainingMs = useMemo(() => {
    if (!isRetryableStatus(status)) return 0;
    const elapsedMs = retryState.status === status ? retryState.elapsedMs : 0;
    return Math.max(0, RETRY_COOLDOWN_MS - elapsedMs);
  }, [retryState, status]);

  if (statusQuery.isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-lg border border-primary-muted bg-primary-muted p-4 text-sm text-primary">
        <Loader2 aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin" />
        <span>Loading KYC status...</span>
      </div>
    );
  }

  if (statusQuery.parsedError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Unable to load KYC status</p>
        <p className="mt-1">{statusQuery.parsedError.message}</p>
      </div>
    );
  }

  if (status === null) {
    return (
      <div role="status" aria-live="polite" className="rounded-lg border border-primary/10 bg-white p-4 text-sm text-primary-light">
        <div className="flex gap-3">
          <CircleDashed aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-primary">No verification attempt yet</p>
            <p className="mt-1 leading-6">
              Submit the verification form when you are ready. No rejection or failure is recorded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return <KycPendingState hasTimedOut={statusQuery.hasPendingPollingTimedOut} />;
  }

  if (status === 'verified') {
    return (
      <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <div className="flex gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Identity verified</p>
            <p className="mt-1 leading-6">Your KYC verification is complete.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isRetryableStatus(status)) {
    return (
      <KycRetryPanel
        status={status}
        reason={statusQuery.data?.rejection_reason}
        cooldownRemainingMs={retryCooldownRemainingMs}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div role="status" aria-live="polite" className="rounded-lg border border-primary-muted bg-primary-muted p-4 text-sm text-primary">
      <div className="flex gap-3">
        <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <p>KYC status is unavailable.</p>
      </div>
    </div>
  );
}
