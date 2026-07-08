export type DashboardNotificationItem = {
  id: string;
  title: string;
  message: string;
  occurredAt: string;
  isRead: boolean;
};

export type DashboardNotificationGroup = {
  id: string;
  label: string;
  items: readonly DashboardNotificationItem[];
};

export type NotificationAdapterCapabilities = {
  markAllAsRead?: boolean;
  markItemAsRead?: boolean;
};

export type UnavailableNotificationAdapter = {
  status: 'unavailable';
  message: string;
};

export type ReadyNotificationAdapter = {
  status: 'ready';
  groups: readonly DashboardNotificationGroup[];
  unreadCount: number;
  capabilities?: NotificationAdapterCapabilities;
  onMarkAllAsRead?: () => void;
  onMarkItemAsRead?: (notificationId: string) => void;
};

export type DashboardNotificationAdapter =
  | UnavailableNotificationAdapter
  | ReadyNotificationAdapter;
