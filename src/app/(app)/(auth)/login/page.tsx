import type { Metadata } from 'next';
import { AuthFormPanel, AuthShell } from '@/components/auth/shared/auth-shell';
import LoginForm from '@/components/auth/login/login-form';
import { getSafeRedirectPath } from '@/lib/auth/redirects';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to GigSecure to manage your income, risk, and protection.',
};

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawRedirect = params?.redirect;
  const redirectValue = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect;
  const redirectTo = getSafeRedirectPath(redirectValue);

  return (
    <AuthShell
      imageSrc="/assets/images/auth-login.png"
      imageAlt="Gig worker seated at a desk looking focused"
    >
      <AuthFormPanel
        title="Welcome back"
        subtitle="Continue managing your income, risks, and protection"
        className="max-w-[38.5rem]"
      >
        <LoginForm redirectTo={redirectTo} />
      </AuthFormPanel>
    </AuthShell>
  );
}
