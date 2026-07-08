import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthRedirectGuard } from '@/components/auth/shared/auth-redirect-guard';
import { ProtectedRoute } from '@/components/auth/shared/protected-route';
import { useAuthStore } from '@/store/auth-store';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { userService } from '@/services/user.service';

const navigation = vi.hoisted(() => ({
  pathname: '/',
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
  useRouter: () => ({
    replace: navigation.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  navigation.pathname = '/';
  navigation.searchParams = new URLSearchParams();
  navigation.replace.mockReset();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('ProtectedRoute', () => {
  it('waits during auth initialization on protected paths', () => {
    navigation.pathname = '/dashboard';
    act(() => {
      useAuthStore.getState().setAuthInitializing();
    });

    renderWithQueryClient(
      <ProtectedRoute>
        <p>Dashboard content</p>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('renders an optional stable fallback during auth initialization', () => {
    navigation.pathname = '/dashboard';
    act(() => {
      useAuthStore.getState().setAuthInitializing();
    });

    renderWithQueryClient(
      <ProtectedRoute fallback={<p role="status">Loading protected application</p>}>
        <p>Dashboard content</p>
      </ProtectedRoute>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading protected application');
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users on protected paths with a safe return path', async () => {
    navigation.pathname = '/dashboard';
    navigation.searchParams = new URLSearchParams('tab=policies');

    renderWithQueryClient(
      <ProtectedRoute>
        <p>Dashboard content</p>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith(
        '/login?redirect=%2Fdashboard%3Ftab%3Dpolicies'
      );
    });
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    navigation.pathname = '/dashboard';
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    renderWithQueryClient(
      <ProtectedRoute>
        <p>Dashboard content</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('rejects client navigation with only a waitlist-issued access token', async () => {
    navigation.pathname = '/dashboard/risk-assessment';
    const getMeSpy = vi.spyOn(userService, 'getMe');
    act(() => {
      useAuthStore.getState().setAccessToken('waitlist-access-token');
    });

    renderWithQueryClient(
      <ProtectedRoute>
        <ProtectedProfileConsumer />
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith(
        '/login?redirect=%2Fdashboard%2Frisk-assessment',
      );
    });
    expect(screen.queryByText('Protected risk assessment')).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().hasFullSession).toBe(false);
    expect(getMeSpy).not.toHaveBeenCalled();
  });

  it('does not guard required email-link auth routes', () => {
    navigation.pathname = '/verify-email';

    renderWithQueryClient(
      <ProtectedRoute>
        <p>Verify email content</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Verify email content')).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

describe('AuthRedirectGuard', () => {
  it('redirects authenticated users away from login to a safe redirect target', async () => {
    navigation.pathname = '/login';
    navigation.searchParams = new URLSearchParams('redirect=%2Fdashboard');
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    renderWithQueryClient(
      <AuthRedirectGuard>
        <p>Login content</p>
      </AuthRedirectGuard>
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('/dashboard');
    });
    expect(screen.queryByText('Login content')).not.toBeInTheDocument();
  });

  it('falls back to dashboard for unsafe public-only redirects', async () => {
    navigation.pathname = '/login';
    navigation.searchParams = new URLSearchParams('redirect=https%3A%2F%2Fevil.example');
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    renderWithQueryClient(
      <AuthRedirectGuard>
        <p>Login content</p>
      </AuthRedirectGuard>
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('keeps login reachable for waitlist-token users without a full session', () => {
    navigation.pathname = '/login';
    act(() => {
      useAuthStore.getState().setAccessToken('waitlist-access-token');
    });

    renderWithQueryClient(
      <AuthRedirectGuard>
        <p>Login content</p>
      </AuthRedirectGuard>,
    );

    expect(screen.getByText('Login content')).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('renders token-link routes even for unauthenticated users', () => {
    navigation.pathname = '/reset-password';

    renderWithQueryClient(
      <AuthRedirectGuard>
        <p>Reset password content</p>
      </AuthRedirectGuard>
    );

    expect(screen.getByText('Reset password content')).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

function ProtectedProfileConsumer() {
  useUserProfile();
  return <p>Protected risk assessment</p>;
}
