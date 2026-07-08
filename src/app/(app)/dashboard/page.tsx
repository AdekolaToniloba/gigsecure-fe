import type { Metadata } from 'next';
import { DashboardOverviewController } from '@/components/dashboard/dashboard-overview-controller';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Review your GigSecure financial risk overview, protection metrics, and recommended next steps.',
};

export default function DashboardPage() {
  return <DashboardOverviewController date={new Date()} />;
}
