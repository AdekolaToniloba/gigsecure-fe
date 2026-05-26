import type { Metadata } from 'next';
import CheckInboxPanel from '@/components/auth/check-inbox/check-inbox-panel';

export const metadata: Metadata = {
  title: 'Check Your Inbox',
  description: 'Check your inbox to continue your GigSecure account setup.',
};

export default function CheckInboxPage() {
  return <CheckInboxPanel />;
}
