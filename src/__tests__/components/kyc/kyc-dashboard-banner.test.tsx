import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { KycDashboardBanner } from '@/components/kyc/dashboard/kyc-dashboard-banner';
import { useAuthStore } from '@/store/auth-store';

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('KycDashboardBanner', () => {
  it('appears for unverified users with accessible alert semantics and a KYC CTA', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    render(<KycDashboardBanner />);

    expect(screen.getByRole('alert', { name: /Complete KYC verification/i })).toBeInTheDocument();
    expect(screen.getByText(/unlock insurance recommendations/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Start KYC/i })).toHaveAttribute('href', '/kyc');
  });

  it('is absent for verified users', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: true,
      });
    });

    render(<KycDashboardBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('can be dismissed for the current component visit and reappears on remount', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    const { unmount } = render(<KycDashboardBanner />);

    await user.click(screen.getByRole('button', { name: /Dismiss KYC reminder/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    unmount();
    render(<KycDashboardBanner />);

    expect(screen.getByRole('alert', { name: /Complete KYC verification/i })).toBeInTheDocument();
  });
});
