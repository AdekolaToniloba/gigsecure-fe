import { BellOff } from 'lucide-react';

type NotificationUnavailableStateProps = {
  message: string;
  compact?: boolean;
};

export function NotificationUnavailableState({
  message,
  compact = false,
}: NotificationUnavailableStateProps) {
  return (
    <div
      role="status"
      aria-label="Notifications unavailable"
      className={compact
        ? 'min-w-0 rounded-lg bg-app-canvas p-4'
        : 'flex min-h-72 min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-canvas p-6 text-center'}
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary"
      >
        <BellOff className="h-5 w-5" />
      </span>
      <p className="mt-3 break-words font-semibold text-primary [overflow-wrap:anywhere]">
        Notifications are not available yet
      </p>
      <p className="mt-1 max-w-md break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
        {message}
      </p>
    </div>
  );
}
