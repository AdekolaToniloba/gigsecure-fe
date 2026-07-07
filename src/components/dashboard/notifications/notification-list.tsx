import { Bell, Check, ShieldCheck } from 'lucide-react';
import type { ReadyNotificationAdapter } from '@/types/dashboard-notifications';

type NotificationListProps = {
  adapter: ReadyNotificationAdapter;
};

const timeFormatter = new Intl.DateTimeFormat('en-NG', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Africa/Lagos',
});

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : timeFormatter.format(date);
}

export function NotificationList({ adapter }: NotificationListProps) {
  const itemCount = adapter.groups.reduce((total, group) => total + group.items.length, 0);
  const canMarkAll = adapter.capabilities?.markAllAsRead === true
    && typeof adapter.onMarkAllAsRead === 'function';
  const canMarkItem = adapter.capabilities?.markItemAsRead === true
    && typeof adapter.onMarkItemAsRead === 'function';

  if (itemCount === 0) {
    return (
      <div
        role="status"
        aria-label="No notifications to show"
        className="rounded-xl border border-dashed border-app-border bg-app-canvas p-6 text-center"
      >
        <Bell aria-hidden="true" className="mx-auto h-6 w-6 text-primary" />
        <p className="mt-3 font-semibold text-primary">No notifications to show</p>
        <p className="mt-1 text-sm text-slate-600">New account updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="space-y-7">
        {adapter.groups.map((group) => (
          <section key={group.id} aria-labelledby={`notification-group-${group.id}`}>
            <h3
              id={`notification-group-${group.id}`}
              className="text-sm font-semibold uppercase tracking-wide text-primary-light"
            >
              {group.label}
            </h3>
            <ul className="mt-3 grid min-w-0 gap-3">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-primary/10 bg-app-sidebar p-4 sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-words font-semibold leading-5 text-primary [overflow-wrap:anywhere]">
                        {item.title}
                      </p>
                      <time
                        dateTime={item.occurredAt}
                        className="shrink-0 text-xs text-primary-light"
                      >
                        {formatNotificationTime(item.occurredAt)}
                      </time>
                    </div>
                    <p className="mt-1 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                      {item.message}
                    </p>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-primary-light">
                        {item.isRead ? 'Read' : 'Unread'}
                      </span>
                      {!item.isRead && canMarkItem ? (
                        <button
                          type="button"
                          onClick={() => adapter.onMarkItemAsRead?.(item.id)}
                          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          <Check aria-hidden="true" className="h-4 w-4" />
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-7 border-t border-app-border pt-5 text-right">
        <span id="mark-all-notifications-description" className="sr-only">
          {canMarkAll
            ? 'Marks every notification as read.'
            : 'Mark all as read is unavailable without notification feed support.'}
        </span>
        <button
          type="button"
          disabled={!canMarkAll}
          onClick={adapter.onMarkAllAsRead}
          aria-describedby="mark-all-notifications-description"
          className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-primary outline-none hover:bg-app-sidebar focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
}
