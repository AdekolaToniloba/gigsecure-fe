import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/shared/auth-shell';
import CheckInboxPanel from '@/components/auth/check-inbox/check-inbox-panel';

export const metadata: Metadata = {
  title: 'Check Your Inbox',
  description: 'Check your inbox to continue your GigSecure account setup.',
};

export default function CheckInboxPage() {
  return (
    <AuthShell
      imageSrc="/assets/images/auth-register.png"
      imageAlt="Smiling gig worker recording content at a desk"
      showCancel={false}
    >
      <CheckInboxPanel />
    </AuthShell>
  );
}
