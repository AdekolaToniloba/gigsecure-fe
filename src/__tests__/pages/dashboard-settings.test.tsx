import React from 'react';
import { act, screen } from '@testing-library/react';
import AppLayout from '@/app/(app)/layout';
import DashboardSettingsLoading from '@/app/(app)/dashboard/settings/loading';
import DashboardSettingsPage, { metadata } from '@/app/(app)/dashboard/settings/page';
import { renderWithProviders } from '@/__tests__/test-utils';
import { useAuthStore } from '@/store/auth-store';

describe('Dashboard Settings route', () => {
  it('exports meaningful route metadata', () => {
    expect(metadata.title).toBe('Settings');
    expect(metadata.description).toMatch(/notification preferences/i);
  });

  it('composes the protected settings page inside the authenticated shell', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'settings-page-token',
        kycVerified: true,
        riskAssessed: true,
      });
    });

    renderWithProviders(
      <AppLayout>
        <DashboardSettingsPage />
      </AppLayout>,
    );

    expect(await screen.findByRole('heading', { name: 'Email notifications' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'App navigation' })).toBeVisible();
    expect(screen.getByRole('main', { name: 'Application content' })).toHaveAttribute(
      'id',
      'dashboard-content',
    );
  });

  it('uses stable route loading geometry', () => {
    renderWithProviders(<DashboardSettingsLoading />);

    expect(screen.getByRole('status', { name: 'Loading settings' })).toBeVisible();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(3);
  });
});
