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
  it('appears for resolved unverified users with a polite labelled status and safe KYC return path', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    render(<KycDashboardBanner />);

    const banner = screen.getByRole('status', { name: 'Verify your KYC' });
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveAttribute('aria-atomic', 'true');
    expect(banner).toHaveTextContent(/unlock personalized insurance recommendations/i);
    expect(screen.getByRole('link', { name: 'Verify now' })).toHaveAttribute(
      'href',
      '/kyc?redirect=%2Fdashboard',
    );
  });

  it('does not flash while the KYC flag is unresolved', () => {
    act(() => {
      useAuthStore.getState().setAccessToken('access-token');
    });

    const { rerender } = render(<KycDashboardBanner />);

    expect(screen.queryByRole('status', { name: 'Verify your KYC' })).not.toBeInTheDocument();

    act(() => {
      useAuthStore.getState().setFlags({ kycVerified: false });
    });
    rerender(<KycDashboardBanner />);

    expect(screen.getByRole('status', { name: 'Verify your KYC' })).toBeInTheDocument();
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

    expect(screen.queryByRole('status', { name: 'Verify your KYC' })).not.toBeInTheDocument();
  });

  it('remains persistent across remounts and has no dismiss control', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    const { unmount } = render(<KycDashboardBanner />);

    expect(screen.queryByRole('button', { name: /Dismiss/i })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Verify your KYC' })).toBeInTheDocument();

    unmount();
    render(<KycDashboardBanner />);

    expect(screen.getByRole('status', { name: 'Verify your KYC' })).toBeInTheDocument();
  });

  it('keeps the CTA keyboard accessible and mobile-width safe', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    render(<KycDashboardBanner />);

    const banner = screen.getByRole('status', { name: 'Verify your KYC' });
    const cta = screen.getByRole('link', { name: 'Verify now' });
    expect(banner).toHaveClass('min-w-0', 'overflow-hidden');
    expect(cta).toHaveClass('min-h-11', 'w-full', 'sm:w-auto');
    await user.tab();
    expect(cta).toHaveFocus();
  });
});
