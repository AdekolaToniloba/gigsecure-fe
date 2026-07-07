'use client';

import { useId } from 'react';
import { Bell } from 'lucide-react';

type NotificationTriggerProps = {
  onOpen?: () => void;
};

export function NotificationTrigger({ onOpen }: NotificationTriggerProps) {
  const descriptionId = useId();
  const isAvailable = typeof onOpen === 'function';

  return (
    <>
      <button
        type="button"
        disabled={!isAvailable}
        onClick={onOpen}
        aria-label={isAvailable ? 'Open notifications' : 'Notifications unavailable'}
        aria-describedby={descriptionId}
        aria-haspopup={isAvailable ? 'dialog' : undefined}
        title={isAvailable ? 'Open notifications' : 'Notifications coming soon'}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-app-border bg-white text-primary shadow-sm transition-colors hover:bg-app-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Bell aria-hidden="true" className="h-5 w-5" />
      </button>
      <span id={descriptionId} className="sr-only">
        {isAvailable
          ? 'Opens the notifications panel.'
          : 'Notifications will be available in a future update.'}
      </span>
    </>
  );
}
