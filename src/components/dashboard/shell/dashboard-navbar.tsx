'use client';

import { WalletCards } from 'lucide-react';
import { lazy, Suspense, useCallback, useState } from 'react';
import { NotificationTrigger } from '@/components/dashboard/notifications/notification-trigger';
import { DashboardSearch } from '@/components/dashboard/shell/dashboard-search';
import { MobileNavigationDrawer } from '@/components/dashboard/shell/mobile-navigation-drawer';

type DashboardNavbarProps = {
  onNotificationsOpen?: () => void;
};

const LazyNotificationPanel = lazy(() =>
  import('@/components/dashboard/notifications/notification-panel').then((module) => ({
    default: module.NotificationPanel,
  })),
);

export function DashboardNavbar({ onNotificationsOpen }: DashboardNavbarProps) {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const openNotifications = useCallback(() => {
    if (onNotificationsOpen) {
      onNotificationsOpen();
      return;
    }
    setIsNotificationPanelOpen(true);
  }, [onNotificationsOpen]);
  const closeNotifications = useCallback(() => setIsNotificationPanelOpen(false), []);

  return (
    <>
      <div
        data-testid="dashboard-navbar"
        className="flex w-full min-w-0 items-center gap-2 sm:gap-3 xl:gap-4"
      >
        <MobileNavigationDrawer />
        <DashboardSearch />

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 xl:gap-4">
          <NotificationTrigger onOpen={openNotifications} />

          <span id="dashboard-placeholder-controls-description" className="sr-only">
            This feature is coming soon and is not currently interactive.
          </span>

          <button
            type="button"
            disabled
            aria-label="Premiums coming soon"
            aria-describedby="dashboard-placeholder-controls-description"
            title="Premiums coming soon"
            className="hidden h-11 shrink-0 items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 text-sm font-semibold text-primary xl:inline-flex disabled:cursor-not-allowed disabled:opacity-65"
          >
            <WalletCards aria-hidden="true" className="h-5 w-5" />
            <span>0 Premiums</span>
          </button>

          <button
            type="button"
            disabled
            aria-describedby="dashboard-placeholder-controls-description"
            title="Product tour coming soon"
            className="hidden h-11 shrink-0 rounded-lg bg-primary px-5 text-sm font-semibold text-accent xl:inline-flex xl:items-center xl:justify-center disabled:cursor-not-allowed disabled:opacity-70"
          >
            Take A Tour
          </button>
        </div>
      </div>

      {isNotificationPanelOpen && !onNotificationsOpen ? (
        <Suspense fallback={<span role="status" className="sr-only">Opening notifications…</span>}>
          <LazyNotificationPanel isOpen onClose={closeNotifications} />
        </Suspense>
      ) : null}
    </>
  );
}
