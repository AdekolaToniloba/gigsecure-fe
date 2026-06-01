import AuthLayoutShell from '@/components/auth/shared/auth-layout-shell';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
