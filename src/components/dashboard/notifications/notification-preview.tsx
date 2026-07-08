'use client';

import { Bell } from 'lucide-react';
import { useId } from 'react';
import { NotificationUnavailableState } from '@/components/dashboard/notifications/notification-unavailable-state';
import type { DashboardNotificationAdapter } from '@/types/dashboard-notifications';

const DEFAULT_PREVIEW_ADAPTER: DashboardNotificationAdapter = {
  status: 'unavailable',
  message: 'We will show account updates here when a notification feed becomes available.',
};

type NotificationPreviewProps = {
  adapter?: DashboardNotificationAdapter;
  onOpen?: () => void;
};

export function NotificationPreview({
  adapter = DEFAULT_PREVIEW_ADAPTER,
  onOpen,
}: NotificationPreviewProps) {
  const titleId = useId();
  const firstItem = adapter.status === 'ready'
    ? adapter.groups.flatMap((group) => group.items)[0]
    : undefined;

  return (
    <section
      aria-labelledby={titleId}
      className="min-w-0 overflow-hidden rounded-xl border border-app-border bg-white p-5 shadow-sm"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <Bell className="h-5 w-5" />
          </span>
          <h2 id={titleId} className="font-heading text-xl font-bold text-primary">
            Notifications
          </h2>
        </div>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-primary outline-none hover:bg-app-sidebar focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Open panel
          </button>
        ) : null}
      </div>

      <div className="mt-4 min-w-0">
        {adapter.status === 'unavailable' ? (
          <NotificationUnavailableState message={adapter.message} compact />
        ) : firstItem ? (
          <div className="min-w-0 rounded-lg bg-app-sidebar p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-light">
              {adapter.unreadCount} unread
            </p>
            <p className="mt-2 break-words font-semibold text-primary [overflow-wrap:anywhere]">
              {firstItem.title}
            </p>
            <p className="mt-1 break-words text-sm leading-5 text-slate-600 [overflow-wrap:anywhere]">
              {firstItem.message}
            </p>
          </div>
        ) : (
          <p role="status" className="rounded-lg bg-app-canvas p-4 text-sm text-slate-600">
            No notifications to show.
          </p>
        )}
      </div>
    </section>
  );
}
