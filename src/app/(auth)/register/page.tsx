import type { Metadata } from 'next';
import { AuthFormPanel } from '@/components/auth/shared/auth-shell';
import RegisterForm from '@/components/auth/register/register-form';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create your GigSecure account and start tracking your risk.',
};

export default function RegisterPage() {
  return (
    <AuthFormPanel
      title="Get started with smarter risk insights"
      subtitle="Sign up to understand, track, and protect your income"
      className="max-w-[38.5rem]"
    >
      <RegisterForm />
    </AuthFormPanel>
  );
}
