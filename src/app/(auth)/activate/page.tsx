import type { Metadata } from 'next';
import ActivateAccountForm from '@/components/auth/activate/activate-account-form';

export const metadata: Metadata = {
  title: 'Activate Account',
  description: 'Activate your GigSecure account by setting your password.',
};

type ActivatePageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const params = await searchParams;
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return <ActivateAccountForm token={token ?? null} />;
}
