import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { KycDashboardBanner } from '@/components/kyc/dashboard/kyc-dashboard-banner';

describe('KycDashboardBanner', () => {
  it('appears for resolved unverified users with a polite labelled status and safe KYC return path', () => {
    render(<KycDashboardBanner isKycVerified={false} />);

    const banner = screen.getByRole('status', { name: 'Verify your KYC' });
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveAttribute('aria-atomic', 'true');
    expect(banner).toHaveTextContent(/unlock personalized insurance recommendations/i);
    expect(screen.getByRole('link', { name: 'Verify now' })).toHaveAttribute(
      'href',
      '/kyc?redirect=%2Fdashboard',
    );
  });

  it('appears when the dashboard passes an unverified flag after a prior verified render', () => {
    const { rerender } = render(<KycDashboardBanner isKycVerified />);
    expect(screen.queryByRole('status', { name: 'Verify your KYC' })).not.toBeInTheDocument();

    rerender(<KycDashboardBanner isKycVerified={false} />);
    expect(screen.getByRole('status', { name: 'Verify your KYC' })).toBeInTheDocument();
  });

  it('is absent for verified users', () => {
    render(<KycDashboardBanner isKycVerified />);

    expect(screen.queryByRole('status', { name: 'Verify your KYC' })).not.toBeInTheDocument();
  });

  it('remains persistent across remounts and has no dismiss control', () => {
    const { unmount } = render(<KycDashboardBanner isKycVerified={false} />);

    expect(screen.queryByRole('button', { name: /Dismiss/i })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Verify your KYC' })).toBeInTheDocument();

    unmount();
    render(<KycDashboardBanner isKycVerified={false} />);

    expect(screen.getByRole('status', { name: 'Verify your KYC' })).toBeInTheDocument();
  });

  it('keeps the CTA keyboard accessible and mobile-width safe', async () => {
    const user = userEvent.setup();
    render(<KycDashboardBanner isKycVerified={false} />);

    const banner = screen.getByRole('status', { name: 'Verify your KYC' });
    const cta = screen.getByRole('link', { name: 'Verify now' });
    expect(banner).toHaveClass('min-w-0', 'overflow-hidden');
    expect(cta).toHaveClass('min-h-11', 'w-full', 'sm:w-auto');
    await user.tab();
    expect(cta).toHaveFocus();
  });
});
