'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { useKycGate } from '@/hooks/kyc/useKycGate';
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/redirects';

const KYC_DASHBOARD_HREF = `/kyc?redirect=${encodeURIComponent(DEFAULT_AUTHENTICATED_PATH)}`;

export function KycDashboardBanner() {
  const { kycVerified } = useKycGate();

  if (kycVerified !== false) return null;

  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-labelledby="dashboard-kyc-banner-title"
      className="mb-6 min-w-0 overflow-hidden rounded-xl border border-primary/20 bg-app-sidebar p-4 sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-white text-primary shadow-sm"
          >
            <BadgeCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2
              id="dashboard-kyc-banner-title"
              className="break-words font-heading text-lg font-bold leading-tight text-primary [overflow-wrap:anywhere]"
            >
              Verify your KYC
            </h2>
            <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-primary-light [overflow-wrap:anywhere]">
              Complete your identity verification to unlock personalized insurance recommendations and protected account actions.
            </p>
          </div>
        </div>

        <Link
          href={KYC_DASHBOARD_HREF}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg border border-primary bg-transparent px-5 py-2.5 text-sm font-semibold text-primary outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
        >
          Verify now
        </Link>
      </div>
    </section>
  );
}
