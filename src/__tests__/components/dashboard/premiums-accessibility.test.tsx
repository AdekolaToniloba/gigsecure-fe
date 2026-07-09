import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PremiumsPageController } from '@/components/dashboard/premiums/premiums-page-controller';
import { renderWithProviders } from '@/__tests__/test-utils';
import { useAuthStore } from '@/store/auth-store';

function setSession() {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'premiums-accessibility-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
}

describe('Premiums accessibility and responsive structure', () => {
  it('keeps one page-level h1 and labelled sections/filters', async () => {
    setSession();
    renderWithProviders(<PremiumsPageController />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Premiums Bought' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Premium filters' })).toHaveClass('overflow-x-auto');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses async announcements and color-independent status text', async () => {
    setSession();
    renderWithProviders(<PremiumsPageController />);

    expect(screen.getByRole('status', { name: 'Loading protection overview' })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Loading premiums' })).toBeVisible();
    expect(await screen.findByText('Active')).toBeVisible();
    expect(screen.getAllByText('Due Soon').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Expired').length).toBeGreaterThan(0);
  });

  it('opens a labelled responsive modal with keyboard-reachable close control', async () => {
    const user = userEvent.setup();
    setSession();
    renderWithProviders(<PremiumsPageController />);

    await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' });
    await user.click(screen.getAllByRole('button', { name: 'View Details' })[0]);

    const dialog = screen.getByRole('dialog', { name: 'Income Shield for Gig Workers' });
    await waitFor(() => expect(dialog).toBeVisible());
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass('h-[94dvh]', 'w-full', 'sm:max-w-[42rem]');
    expect(screen.getByRole('button', { name: 'Close policy details' })).toBeVisible();
  });

  it('keeps card action rows and metric grids responsive by structure', async () => {
    setSession();
    renderWithProviders(<PremiumsPageController />);

    await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' });
    expect(screen.getAllByRole('button', { name: 'View Details' })[0].closest('div')).toHaveClass(
      'flex-col',
      'sm:flex-row',
      'sm:flex-wrap',
    );
    expect(screen.getByText('Total Coverage').closest('dl')).toHaveClass('sm:grid-cols-3');
  });
});
