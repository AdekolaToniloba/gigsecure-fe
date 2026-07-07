import type {
  DashboardNotificationAdapter,
  DashboardNotificationItem,
} from '@/types/dashboard-notifications';

export type DashboardNotificationFixture = DashboardNotificationItem & {
  group: 'today' | 'yesterday';
};

// Component-test data only. There is no production notification-feed contract.
export const dashboardNotificationFixtures: readonly DashboardNotificationFixture[] = [
  {
    id: 'notification-risk-score',
    title: 'Your financial risk assessment is ready',
    message: 'Review your score and the recommended protection actions prepared for your profile.',
    occurredAt: '2026-07-06T09:30:00+01:00',
    group: 'today',
    isRead: false,
  },
  {
    id: 'notification-plan-recommendation',
    title: 'A new protection plan recommendation is available',
    message: 'Explore a recommendation based on your income pattern and current safety buffer.',
    occurredAt: '2026-07-05T16:15:00+01:00',
    group: 'yesterday',
    isRead: true,
  },
];

export const dashboardNotificationFixtureAdapter: DashboardNotificationAdapter = {
  status: 'ready',
  unreadCount: 1,
  groups: [
    {
      id: 'today',
      label: 'Today',
      items: dashboardNotificationFixtures.filter((item) => item.group === 'today'),
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      items: dashboardNotificationFixtures.filter((item) => item.group === 'yesterday'),
    },
  ],
  capabilities: {
    markAllAsRead: false,
    markItemAsRead: false,
  },
};
