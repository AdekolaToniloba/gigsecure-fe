import type { Metadata } from 'next';
import { ProfilePageController } from '@/components/dashboard/profile/profile-page-controller';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your GigSecure personal information, risk data summary, and account security.',
};

export default function DashboardProfilePage() {
  return <ProfilePageController />;
}
