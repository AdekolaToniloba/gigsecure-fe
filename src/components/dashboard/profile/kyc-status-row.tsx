'use client';

import { ShieldCheck } from 'lucide-react';
import { useKycStatus } from '@/hooks/kyc/useKyc';
import { ProfileStatus } from './profile-status';
import { SecurityRow } from './security-row';

type KycStatusRowProps = {
  onRetry?: () => void;
};

export function KycStatusRow({ onRetry }: KycStatusRowProps) {
  const kycStatus = useKycStatus();

  if (kycStatus.isError) {
    return (
      <SecurityRow
        icon={ShieldCheck}
        label="Identity verification"
        helperText={kycStatus.parsedError?.message ?? 'Unable to load your verification status.'}
        status={<ProfileStatus label="Unavailable" tone="error" />}
        action={{ kind: 'button', label: 'Retry', onClick: onRetry ?? (() => void kycStatus.refetch()) }}
      />
    );
  }

  const status = kycStatus.data?.status;
  if (status === 'verified') {
    return (
      <SecurityRow
        icon={ShieldCheck}
        label="Identity verification"
        helperText={kycStatus.data?.verified_at
          ? `Verified on ${new Intl.DateTimeFormat('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(new Date(kycStatus.data.verified_at))}.`
          : 'Your identity has been verified.'}
        status={<ProfileStatus label="Verified" tone="success" />}
        action={{ kind: 'link', label: 'View details', href: '/kyc' }}
      />
    );
  }

  if (status === 'pending') {
    return (
      <SecurityRow
        icon={ShieldCheck}
        label="Identity verification"
        helperText="Your verification is still being reviewed."
        status={<ProfileStatus label="Pending" tone="warning" />}
        action={{ kind: 'link', label: 'Review', href: '/kyc' }}
      />
    );
  }

  if (status === 'rejected') {
    return (
      <SecurityRow
        icon={ShieldCheck}
        label="Identity verification"
        helperText={kycStatus.data?.rejection_reason ?? 'The submitted details did not match identity records.'}
        status={<ProfileStatus label="Needs attention" tone="error" />}
        action={{ kind: 'link', label: 'Retry', href: '/kyc' }}
      />
    );
  }

  if (status === 'failed') {
    return (
      <SecurityRow
        icon={ShieldCheck}
        label="Identity verification"
        helperText={kycStatus.data?.rejection_reason ?? 'Verification could not be completed due to a technical issue.'}
        status={<ProfileStatus label="Unavailable" tone="error" />}
        action={{ kind: 'link', label: 'Retry', href: '/kyc' }}
      />
    );
  }

  return (
    <SecurityRow
      icon={ShieldCheck}
      label="Identity verification"
      helperText="Verify your identity to keep your account information up to date."
      status={<ProfileStatus label="Not started" />}
      action={{ kind: 'link', label: 'Verify', href: '/kyc' }}
      loading={kycStatus.isPending}
    />
  );
}
