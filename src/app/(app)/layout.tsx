import { ProtectedRoute } from '@/components/auth/shared/protected-route';
import { AppSidebar } from '@/components/dashboard/shell/app-sidebar';
import { AuthenticatedAppShell } from '@/components/dashboard/shell/authenticated-app-shell';
import { AppShellSkeleton } from '@/components/dashboard/shell/app-shell-skeleton';
import { DashboardNavbar } from '@/components/dashboard/shell/dashboard-navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      fallback={(
        <AuthenticatedAppShell
          sidebar={<AppSidebar />}
          header={<DashboardNavbar />}
        >
          <AppShellSkeleton />
        </AuthenticatedAppShell>
      )}
    >
      <AuthenticatedAppShell
        sidebar={<AppSidebar />}
        header={<DashboardNavbar />}
      >
        {children}
      </AuthenticatedAppShell>
    </ProtectedRoute>
  );
}
