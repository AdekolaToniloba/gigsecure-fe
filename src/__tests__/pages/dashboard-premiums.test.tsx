import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AppLayout from '@/app/(app)/layout';
import DashboardPremiumsError from '@/app/(app)/dashboard/premiums/error';
import DashboardPremiumsLoading from '@/app/(app)/dashboard/premiums/loading';
import DashboardPremiumsPage, { metadata } from '@/app/(app)/dashboard/premiums/page';
import { mockPathname, renderWithProviders } from '@/__tests__/test-utils';
import { useAuthStore } from '@/store/auth-store';

describe('Dashboard Premiums route', () => {
  it('exports meaningful route metadata', () => {
    expect(metadata.title).toBe('Premiums Bought');
    expect(metadata.description).toMatch(/protection plans/i);
  });

  it('composes the protected premiums page inside the authenticated shell', async () => {
    mockPathname.value = '/dashboard/premiums';
    setFullSession();

    renderWithProviders(
      <AppLayout>
        <DashboardPremiumsPage />
      </AppLayout>,
    );

    expect(await screen.findByRole('heading', { name: 'Premiums Bought' })).toBeVisible();
    expect(screen.getByText('Manage your Active protection and upcoming payments.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Premiums Bought' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await screen.findByRole('heading', { name: 'Your Protection Overview' })).toBeVisible();
    expect(await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeVisible();
    expect(screen.getByRole('main', { name: 'Application content' })).toHaveAttribute(
      'id',
      'dashboard-content',
    );
  });

  it('opens policy detail panel from the composed page', async () => {
    const user = userEvent.setup();
    mockPathname.value = '/dashboard/premiums';
    setFullSession();

    renderWithProviders(<DashboardPremiumsPage />);

    await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' });
    await user.click(screen.getAllByRole('button', { name: 'View Details' })[0]);

    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Income Shield for Gig Workers' })).toBeVisible(),
    );
    expect(screen.getByText(/policy document link is not available/i)).toBeVisible();
  });

  it('uses stable route loading geometry', () => {
    renderWithProviders(<DashboardPremiumsLoading />);

    expect(screen.getByRole('status', { name: 'Loading protection overview' })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Loading premiums' })).toBeVisible();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(6);
  });

  it('renders a resettable friendly route error boundary', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    renderWithProviders(<DashboardPremiumsError error={new Error('boom')} reset={reset} />);

    expect(screen.getByRole('heading', { name: 'Premiums unavailable' })).toBeVisible();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reload premiums' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

function setFullSession() {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'premiums-page-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
}
