import type { Metadata } from 'next';
import ResetPasswordForm from '@/components/auth/reset-password/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Create a new password for your GigSecure account.',
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return <ResetPasswordForm token={token ?? null} />;
}
