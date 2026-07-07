import React, { useCallback, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationPanel } from '@/components/dashboard/notifications/notification-panel';
import { NotificationPreview } from '@/components/dashboard/notifications/notification-preview';
import { NotificationTrigger } from '@/components/dashboard/notifications/notification-trigger';
import { apiClient } from '@/lib/api/client';
import { dashboardNotificationFixtureAdapter } from '@/mocks/fixtures/dashboard-notifications';
import type {
  DashboardNotificationAdapter,
  ReadyNotificationAdapter,
} from '@/types/dashboard-notifications';

beforeEach(() => {
  document.body.style.overflow = '';
});

describe('NotificationPanel production boundary', () => {
  it('does not render while closed', () => {
    render(<NotificationPanel isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from the bell with an honest unavailable state and no network request or fake count', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const apiGetSpy = vi.spyOn(apiClient, 'get');
    render(<PanelHarness />);

    await user.click(screen.getByRole('button', { name: 'Open notifications' }));

    const dialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Notification feed unavailable.');
    expect(within(dialog).getByRole('status', {
      name: 'Notifications unavailable',
    })).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(/\d+ unread/i);
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(apiGetSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    apiGetSpy.mockRestore();
  });

  it('focuses Back, traps focus, locks scroll, and restores the bell after explicit close', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);
    const trigger = screen.getByRole('button', { name: 'Open notifications' });

    await user.click(trigger);
    const back = screen.getByRole('button', { name: 'Back' });
    await waitFor(() => expect(back).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');

    await user.tab();
    expect(back).toHaveFocus();
    await user.tab({ shift: true });
    expect(back).toHaveFocus();

    await user.click(back);
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe('');
  });

  it('closes by Escape and backdrop while restoring focus', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);
    const trigger = screen.getByRole('button', { name: 'Open notifications' });

    await user.click(trigger);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    await user.click(screen.getByTestId('notification-panel-backdrop'));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses full-screen mobile geometry, bounded desktop width, and reduced-motion-safe classes', () => {
    render(<NotificationPanel isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(dialog).toHaveClass(
      'h-dvh',
      'w-full',
      'max-w-full',
      'sm:max-w-[41.875rem]',
      'motion-reduce:transition-none',
    );
    expect(screen.getByTestId('notification-panel-backdrop')).toHaveClass(
      'overflow-hidden',
      'motion-reduce:transition-none',
    );
  });
});

describe('NotificationPanel populated adapter', () => {
  it('renders fixture-driven Today and Yesterday groups with truthful unread state', () => {
    render(
      <NotificationPanel
        isOpen
        onClose={vi.fn()}
        adapter={dashboardNotificationFixtureAdapter}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(dialog).toHaveAccessibleDescription('1 unread notification.');
    expect(within(dialog).getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(within(dialog).getByText('Unread')).toBeInTheDocument();
    expect(within(dialog).getByText('Read')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(2);

    const markAll = within(dialog).getByRole('button', { name: 'Mark all as read' });
    expect(markAll).toBeDisabled();
    expect(markAll).toHaveAccessibleDescription(
      'Mark all as read is unavailable without notification feed support.',
    );
    expect(within(dialog).queryByRole('button', { name: 'Mark as read' })).not.toBeInTheDocument();
  });

  it('activates only explicitly supplied read capabilities and loops focus', async () => {
    const user = userEvent.setup();
    const onMarkAllAsRead = vi.fn();
    const onMarkItemAsRead = vi.fn();
    const adapter: ReadyNotificationAdapter = {
      ...(dashboardNotificationFixtureAdapter as ReadyNotificationAdapter),
      capabilities: { markAllAsRead: true, markItemAsRead: true },
      onMarkAllAsRead,
      onMarkItemAsRead,
    };
    render(<NotificationPanel isOpen onClose={vi.fn()} adapter={adapter} />);

    const back = screen.getByRole('button', { name: 'Back' });
    const markItem = screen.getByRole('button', { name: 'Mark as read' });
    const markAll = screen.getByRole('button', { name: 'Mark all as read' });
    await waitFor(() => expect(back).toHaveFocus());

    await user.click(markItem);
    expect(onMarkItemAsRead).toHaveBeenCalledWith('notification-risk-score');
    await user.click(markAll);
    expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);

    back.focus();
    await user.tab({ shift: true });
    expect(markAll).toHaveFocus();
    await user.tab();
    expect(back).toHaveFocus();
  });

  it('renders a truthful ready-empty state', () => {
    const adapter: DashboardNotificationAdapter = {
      status: 'ready',
      unreadCount: 0,
      groups: [],
    };
    render(<NotificationPanel isOpen onClose={vi.fn()} adapter={adapter} />);

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('All notifications are read.');
    expect(screen.getByRole('status', { name: 'No notifications to show' })).toBeInTheDocument();
  });
});

describe('NotificationPreview', () => {
  it('defaults to the honest unavailable production state without unread counts', () => {
    render(<NotificationPreview />);

    const preview = screen.getByRole('region', { name: 'Notifications' });
    expect(preview).toHaveTextContent('Notifications are not available yet');
    expect(preview).not.toHaveTextContent(/\d+ unread/i);
    expect(screen.queryByRole('button', { name: 'Open panel' })).not.toBeInTheDocument();
  });

  it('can render fixture-backed preview content and a real panel callback', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <NotificationPreview
        adapter={dashboardNotificationFixtureAdapter}
        onOpen={onOpen}
      />,
    );

    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(screen.getByText('Your financial risk assessment is ready')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open panel' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

function PanelHarness({ adapter }: { adapter?: DashboardNotificationAdapter }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <NotificationTrigger onOpen={() => setIsOpen(true)} />
      <NotificationPanel isOpen={isOpen} onClose={close} adapter={adapter} />
    </>
  );
}
