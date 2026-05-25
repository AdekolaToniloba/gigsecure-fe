import { AuthRedirectGuard } from '@/components/auth/shared/auth-redirect-guard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthRedirectGuard>{children}</AuthRedirectGuard>;
}
