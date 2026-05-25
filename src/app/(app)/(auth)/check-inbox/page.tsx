import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check Your Inbox',
  description: 'Check your inbox to continue your GigSecure account setup.',
};

export default function CheckInboxPage() {
  return <div className="sr-only">Check your inbox</div>;
}
