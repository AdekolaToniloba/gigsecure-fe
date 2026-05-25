import { useAuthStore } from '@/store/auth-store';
import { useSilentRefresh } from './useAuth';

export function useSession() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const firstName = useAuthStore((s) => s.firstName);
  const lastName = useAuthStore((s) => s.lastName);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const status = useAuthStore((s) => s.status);
  const refreshMutation = useSilentRefresh();

  return {
    accessToken,
    firstName,
    lastName,
    user,
    isAuthenticated,
    status,
    isInitializing: status === 'initializing' || refreshMutation.isPending,
    refresh: refreshMutation.mutateAsync,
    refreshStatus: refreshMutation.status,
    refreshError: refreshMutation.error,
  };
}
