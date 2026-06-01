import type { Metadata } from 'next';
import { AuthFormPanel } from '@/components/auth/shared/auth-shell';
import LoginForm from '@/components/auth/login/login-form';
import { getSafeRedirectPath } from '@/lib/auth/redirects';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to GigSecure to manage your income, risk, and protection.',
};

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string | string[];
    reset?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawRedirect = params?.redirect;
  const rawReset = params?.reset;
  const redirectValue = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect;
  const resetValue = Array.isArray(rawReset) ? rawReset[0] : rawReset;
  const redirectTo = getSafeRedirectPath(redirectValue);
  const successMessage =
    resetValue === 'success'
      ? 'Your password has been reset. Log in with your new password.'
      : null;

  return (
    <AuthFormPanel
      title="Welcome back"
      subtitle="Continue managing your income, risks, and protection"
      className="max-w-[38.5rem]"
    >
      <LoginForm redirectTo={redirectTo} successMessage={successMessage} />
    </AuthFormPanel>
  );
}
