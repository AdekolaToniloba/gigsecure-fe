import React from 'react';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardPage from '@/app/(app)/dashboard/page';
import { useAuthStore } from '@/store/auth-store';
import { renderWithProviders } from '@/__tests__/test-utils';

describe('DashboardPage', () => {
  it('places the KYC banner above dashboard content for unverified users', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('alert', { name: /Complete KYC verification/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Recommendations/i })).toBeInTheDocument();
  });

  it('does not render the KYC banner for verified users', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: true,
      });
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.queryByRole('alert', { name: /Complete KYC verification/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Recommendations/i })).toBeInTheDocument();
  });
});
