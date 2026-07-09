import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardNavbar } from '@/components/dashboard/shell/dashboard-navbar';
import { DashboardSearch } from '@/components/dashboard/shell/dashboard-search';
import { NotificationTrigger } from '@/components/dashboard/notifications/notification-trigger';

const navigation = vi.hoisted(() => ({ pathname: '/dashboard' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = '/dashboard';
  document.body.style.overflow = '';
});

describe('DashboardSearch', () => {
  it('keeps typed search text local and prevents form submission', async () => {
    const user = userEvent.setup();
    render(<DashboardSearch />);

    const search = screen.getByRole('searchbox', { name: 'Search dashboard' });
    await user.type(search, 'income protection{Enter}');

    expect(search).toHaveValue('income protection');
    expect(screen.getByRole('search', { name: 'Dashboard search' })).toBeInTheDocument();
    expect(search).toHaveAccessibleDescription(
      'Search text stays on this page and does not request results.'
    );
  });
});

describe('NotificationTrigger', () => {
  it('calls the lightweight panel boundary when notifications are available', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<NotificationTrigger onOpen={onOpen} />);

    const trigger = screen.getByRole('button', { name: 'Open notifications' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(trigger);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('truthfully disables the trigger until a panel callback exists', () => {
    render(<NotificationTrigger />);

    const trigger = screen.getByRole('button', { name: 'Notifications unavailable' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAccessibleDescription(
      'Notifications will be available in a future update.'
    );
  });
});

describe('DashboardNavbar', () => {
  it('wires the menu trigger to the existing accessible drawer', async () => {
    const user = userEvent.setup();
    render(<DashboardNavbar />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    expect(screen.getByRole('dialog', { name: 'Application navigation' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the lazy production notification panel from the bell', async () => {
    const user = userEvent.setup();
    render(<DashboardNavbar />);

    await user.click(screen.getByRole('button', { name: 'Open notifications' }));

    expect(await screen.findByRole('dialog', { name: 'Notifications' })).toHaveTextContent(
      'Notifications are not available yet',
    );
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open notifications' })).toHaveFocus();
  });

  it('renders non-deceptive disabled desktop placeholders', () => {
    render(<DashboardNavbar />);

    expect(screen.getByRole('button', { name: 'Premiums coming soon' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Premiums coming soon' })).toHaveClass(
      'hidden',
      'xl:inline-flex'
    );
    expect(screen.getByRole('button', { name: 'Take A Tour' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Take A Tour' })).toHaveClass(
      'hidden',
      'xl:inline-flex'
    );
  });

  it('shows the route title instead of dashboard search on the risk assessment route', () => {
    navigation.pathname = '/dashboard/risk-assessment';
    render(<DashboardNavbar onNotificationsOpen={vi.fn()} />);

    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search dashboard' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveClass('h-11', 'w-11');
  });

  it('prioritizes menu, search, and bell with touch-sized responsive controls', () => {
    render(<DashboardNavbar onNotificationsOpen={vi.fn()} />);

    expect(screen.getByTestId('dashboard-navbar')).toHaveClass('min-w-0', 'w-full');
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveClass(
      'h-11',
      'w-11'
    );
    expect(screen.getByRole('search', { name: 'Dashboard search' })).toHaveClass(
      'min-w-0',
      'flex-1',
      'lg:max-w-[28.5rem]'
    );
    expect(screen.getByRole('button', { name: 'Open notifications' })).toHaveClass(
      'h-11',
      'w-11'
    );
  });

  it('keeps the primary mobile controls in a logical keyboard order', async () => {
    const user = userEvent.setup();
    render(<DashboardNavbar onNotificationsOpen={vi.fn()} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('searchbox', { name: 'Search dashboard' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Open notifications' })).toHaveFocus();
  });
});
