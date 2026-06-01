import type { Metadata } from 'next';
import ChangePasswordForm from '@/components/auth/change-password/change-password-form';

export const metadata: Metadata = {
  title: 'Change Password',
  description: 'Change your GigSecure account password.',
};

export default function ChangePasswordPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-2xl items-center justify-center py-10">
      <ChangePasswordForm />
    </section>
  );
}
