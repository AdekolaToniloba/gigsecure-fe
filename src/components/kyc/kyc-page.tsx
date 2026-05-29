'use client';

import { useCallback } from 'react';
import { useKycGate } from '@/hooks/kyc/useKycGate';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { KycStatusPanel } from '@/components/kyc/status/kyc-status-panel';
import { KycFormShell } from '@/components/kyc/verify/kyc-form-shell';
import { KycVerificationForm } from '@/components/kyc/verify/kyc-verification-form';

export function KycPageContent() {
  const { isKycVerified } = useKycGate();
  const profileQuery = useUserProfile();
  const handleRetry = useCallback(() => {
    const formField = document.getElementById('kyc-document-number');
    formField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    formField?.focus();
  }, []);

  const user = profileQuery.data?.user;
  const profile = profileQuery.data?.profile;

  return (
    <KycFormShell>
      <div className="space-y-6">
        {isKycVerified ? (
          <section
            aria-label="KYC verified summary"
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900"
          >
            <p className="text-sm font-semibold">KYC successfully verified</p>
            <p className="mt-1 text-sm">
              Your identity has already been verified and your account is in good standing.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-green-800">
              KYC status
            </p>
            <p className="mt-1 inline-flex rounded-md bg-green-100 px-2.5 py-1 text-sm font-medium text-green-900">
              Verified
            </p>
          </section>
        ) : null}

        {user ? (
          <section
            aria-label="User information"
            className="rounded-lg border border-primary/10 bg-white p-4 text-sm text-slate-700"
          >
            <h2 className="text-sm font-semibold text-primary">User information</h2>
            <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-primary-light">Full name</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Not available'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-primary-light">Email</dt>
                <dd className="mt-1 text-sm text-slate-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-primary-light">Date of birth</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {profile?.date_of_birth || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-primary-light">City</dt>
                <dd className="mt-1 text-sm text-slate-900">{profile?.city || 'Not provided'}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section aria-label="KYC status">
          <KycStatusPanel onRetry={handleRetry} />
        </section>
        {!isKycVerified ? (
          <section aria-label="KYC verification form">
            <KycVerificationForm />
          </section>
        ) : null}
      </div>
    </KycFormShell>
  );
}
