import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KycPageContent } from '@/components/kyc/kyc-page';

vi.mock('@/hooks/kyc/useKycGate', () => ({
  useKycGate: vi.fn(),
}));

vi.mock('@/hooks/user/useUserProfile', () => ({
  useUserProfile: vi.fn(),
}));

vi.mock('@/components/kyc/status/kyc-status-panel', () => ({
  KycStatusPanel: () => <div>KYC status panel</div>,
}));

vi.mock('@/components/kyc/verify/kyc-verification-form', () => ({
  KycVerificationForm: () => <div>KYC verification form</div>,
}));

import { useKycGate } from '@/hooks/kyc/useKycGate';
import { useUserProfile } from '@/hooks/user/useUserProfile';

const mockedUseKycGate = vi.mocked(useKycGate);
const mockedUseUserProfile = vi.mocked(useUserProfile);

describe('KycPageContent', () => {
  it('shows verified copy, verified status, and user info when KYC is verified', () => {
    mockedUseKycGate.mockReturnValue({
      kycVerified: true,
      riskAssessed: true,
      isKycVerified: true,
      isRiskAssessed: true,
      isLoading: false,
      hasResolvedFlags: true,
      status: 'authenticated',
      canProceed: true,
    });
    mockedUseUserProfile.mockReturnValue({
      data: {
        user: {
          id: 'u1',
          email: 'verified@gigsecure.com',
          first_name: 'Amaka',
          last_name: 'Obi',
          status: 'active',
          role: 'user',
          email_verified: true,
          phone_number: null,
          last_login_at: null,
          created_at: null,
        },
        profile: {
          date_of_birth: '1995-06-15',
          city: 'Lagos',
          gender: null,
          address_line_1: null,
          address_line_2: null,
          state: null,
          country: null,
          postal_code: null,
          occupation: null,
          gig_platform: null,
          average_monthly_income: null,
          years_of_experience: null,
          profile_picture_url: null,
        },
        kyc_verified: true,
        risk_assessed: true,
      },
      isLoading: false,
      error: null,
    } as never);

    render(<KycPageContent />);

    expect(screen.getByText(/KYC successfully verified/i)).toBeInTheDocument();
    expect(screen.getByText(/^Verified$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /User information/i })).toBeInTheDocument();
    expect(screen.getByText('Amaka Obi')).toBeInTheDocument();
    expect(screen.getByText('verified@gigsecure.com')).toBeInTheDocument();
    expect(screen.queryByText('KYC verification form')).not.toBeInTheDocument();
  });

  it('shows verification form when KYC is not verified', () => {
    mockedUseKycGate.mockReturnValue({
      kycVerified: false,
      riskAssessed: true,
      isKycVerified: false,
      isRiskAssessed: true,
      isLoading: false,
      hasResolvedFlags: true,
      status: 'authenticated',
      canProceed: true,
    });
    mockedUseUserProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as never);

    render(<KycPageContent />);

    expect(screen.getByText('KYC verification form')).toBeInTheDocument();
    expect(screen.queryByText(/KYC successfully verified/i)).not.toBeInTheDocument();
  });
});
