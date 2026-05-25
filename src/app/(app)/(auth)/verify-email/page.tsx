import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/shared/auth-shell';
import VerifyEmailStatus from '@/components/auth/verify-email/verify-email-status';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your GigSecure email address and continue your account setup.',
};

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return (
    <AuthShell
      imageSrc="/assets/images/auth-register.png"
      imageAlt="Smiling gig worker recording content at a desk"
      showCancel={false}
    >
      <VerifyEmailStatus token={token ?? null} />
    </AuthShell>
  );
}
