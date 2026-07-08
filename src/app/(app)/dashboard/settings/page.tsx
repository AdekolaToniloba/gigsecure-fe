import type { Metadata } from 'next';
import { SettingsPageController } from '@/components/dashboard/settings/settings-page-controller';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage GigSecure notification preferences, privacy controls, and account actions.',
};

export default function DashboardSettingsPage() {
  return <SettingsPageController />;
}
