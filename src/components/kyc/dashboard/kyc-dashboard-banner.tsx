'use client';

import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useKycGate } from '@/hooks/kyc/useKycGate';

export function KycDashboardBanner() {
  const { isKycVerified, isLoading } = useKycGate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || isKycVerified || isDismissed) return null;

  return (
    <section
      role="alert"
      aria-labelledby="dashboard-kyc-banner-title"
      className="mb-6 rounded-lg border border-primary/15 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 id="dashboard-kyc-banner-title" className="font-heading text-lg font-bold text-primary">
              Complete KYC verification
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-light">
              Verify your identity to unlock insurance recommendations and continue with protected account actions.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pl-4">
          <Link
            href="/kyc"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-accent transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start KYC
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss KYC reminder"
            className="h-10 w-10 px-0"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
