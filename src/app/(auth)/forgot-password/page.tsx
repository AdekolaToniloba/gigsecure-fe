import type { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/forgot-password/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Request a GigSecure password reset link for your account.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
