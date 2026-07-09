import type { Metadata } from 'next';
import { PremiumsPageController } from '@/components/dashboard/premiums/premiums-page-controller';

export const metadata: Metadata = {
  title: 'Premiums Bought',
  description: 'Manage your active GigSecure protection plans, policy details, and premiums.',
};

export default function DashboardPremiumsPage() {
  return <PremiumsPageController />;
}
