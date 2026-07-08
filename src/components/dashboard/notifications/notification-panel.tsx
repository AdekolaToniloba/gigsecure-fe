'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NotificationList } from '@/components/dashboard/notifications/notification-list';
import { NotificationUnavailableState } from '@/components/dashboard/notifications/notification-unavailable-state';
import type { DashboardNotificationAdapter } from '@/types/dashboard-notifications';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const UNAVAILABLE_NOTIFICATION_ADAPTER: DashboardNotificationAdapter = {
  status: 'unavailable',
  message: 'We will show account updates here when a notification feed becomes available.',
};

type NotificationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  adapter?: DashboardNotificationAdapter;
};

export function NotificationPanel({
  isOpen,
  onClose,
  adapter = UNAVAILABLE_NOTIFICATION_ADAPTER,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    backButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const summary = adapter.status === 'ready'
    ? adapter.unreadCount === 0
      ? 'All notifications are read.'
      : `${adapter.unreadCount} unread ${adapter.unreadCount === 1 ? 'notification' : 'notifications'}.`
    : 'Notification feed unavailable.';

  function handleBackdropMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex min-w-0 justify-end overflow-hidden bg-black/45 backdrop-blur-[1px] motion-reduce:transition-none"
      onMouseDown={handleBackdropMouseDown}
      data-testid="notification-panel-backdrop"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-panel-title"
        aria-describedby="notification-panel-summary"
        tabIndex={-1}
        className="flex h-dvh w-full max-w-full min-w-0 flex-col overflow-hidden overscroll-contain bg-white shadow-2xl outline-none transition-transform duration-200 motion-reduce:transition-none sm:max-w-[41.875rem]"
      >
        <span className="sr-only" role="status" aria-live="polite">
          Notifications panel opened.
        </span>
        <header className="shrink-0 border-b border-app-border px-4 py-5 sm:px-7 sm:py-6">
          <button
            ref={backButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary outline-none hover:bg-app-sidebar focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            Back
          </button>
          <div className="mt-4 min-w-0">
            <h2 id="notification-panel-title" className="font-heading text-2xl font-bold text-primary sm:text-3xl">
              Notifications
            </h2>
            <p id="notification-panel-summary" className="mt-1 text-sm leading-6 text-primary-light">
              {summary}
            </p>
          </div>
        </header>

        <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-7">
          {adapter.status === 'ready' ? (
            <NotificationList adapter={adapter} />
          ) : (
            <NotificationUnavailableState message={adapter.message} />
          )}
        </div>
      </div>
    </div>
  );
}
