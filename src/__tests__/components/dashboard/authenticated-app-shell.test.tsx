import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '@/app/(app)/layout';
import {
  APP_MAIN_ID,
  AuthenticatedAppShell,
} from '@/components/dashboard/shell/authenticated-app-shell';
import { useAuthStore } from '@/store/auth-store';

const navigation = vi.hoisted(() => ({
  pathname: '/dashboard',
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
  navigation.pathname = '/dashboard';
  navigation.searchParams = new URLSearchParams();
  navigation.replace.mockReset();
  act(() => useAuthStore.getState().clearAuth());
});

describe('AuthenticatedAppShell', () => {
  it('provides uniquely labelled shell landmarks and renders each slot', () => {
    const { container } = render(
      <AuthenticatedAppShell
        sidebar={<p>Sidebar slot</p>}
        header={<p>Header slot</p>}
      >
        <h1>Protected page</h1>
      </AuthenticatedAppShell>
    );

    expect(container.querySelector('a')).toHaveTextContent('Skip to dashboard content');
    expect(screen.getByRole('complementary', { name: 'Application sidebar' })).toHaveTextContent(
      'Sidebar slot'
    );
    expect(screen.getByRole('banner', { name: 'Application header' })).toHaveTextContent(
      'Header slot'
    );
    expect(screen.getByRole('main', { name: 'Application content' })).toHaveAttribute(
      'id',
      APP_MAIN_ID
    );
    expect(screen.getByRole('heading', { name: 'Protected page' })).toBeInTheDocument();
  });

  it('moves keyboard focus to the main content from the first focusable control', async () => {
    const user = userEvent.setup();
    render(
      <AuthenticatedAppShell>
        <button type="button">Page action</button>
      </AuthenticatedAppShell>
    );

    await user.tab();
    const skipLink = screen.getByRole('link', { name: 'Skip to dashboard content' });
    expect(skipLink).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('main', { name: 'Application content' })).toHaveFocus();
  });

  it('reserves desktop shell geometry without introducing page overflow classes', () => {
    render(
      <AuthenticatedAppShell>
        <div>Page content</div>
      </AuthenticatedAppShell>
    );

    const main = screen.getByRole('main', { name: 'Application content' });
    const sidebar = screen.getByRole('complementary', { name: 'Application sidebar' });
    const shellGrid = main.parentElement?.parentElement;

    expect(shellGrid).toHaveClass('lg:grid-cols-[18.625rem_minmax(0,1fr)]', 'min-w-0');
    expect(sidebar).toHaveClass('hidden', 'lg:flex');
    expect(main).toHaveClass('min-w-0');
    expect(main.closest('.overflow-x-clip')).not.toBeNull();
  });
});

describe('protected app layout composition', () => {
  it('keeps the dashboard navbar inside the content-column header', () => {
    setFullSession();

    renderWithQueryClient(
      <AppLayout>
        <p>Dashboard page content</p>
      </AppLayout>
    );

    const header = screen.getByRole('banner', { name: 'Application header' });
    const sidebar = screen.getByRole('complementary', { name: 'Application sidebar' });

    expect(within(header).getByRole('searchbox', { name: 'Search dashboard' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();
    expect(within(sidebar).queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('keeps shell geometry visible while auth initializes without exposing protected content', () => {
    act(() => useAuthStore.getState().setAuthInitializing());

    renderWithQueryClient(
      <AppLayout>
        <p>Secret dashboard data</p>
      </AppLayout>
    );

    expect(screen.getByRole('status', { name: 'Loading protected application' })).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard data')).not.toBeInTheDocument();
    expect(screen.getByRole('main', { name: 'Application content' })).toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('does not render authenticated shell content for a waitlist-only token', async () => {
    navigation.pathname = '/dashboard/risk-assessment';
    act(() => useAuthStore.getState().setAccessToken('waitlist-access-token'));

    renderWithQueryClient(
      <AppLayout>
        <p>Secret risk assessment</p>
      </AppLayout>,
    );

    expect(screen.queryByRole('navigation', { name: 'Application navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('banner', { name: 'Application header' })).not.toBeInTheDocument();
    expect(screen.queryByText('Secret risk assessment')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith(
        '/login?redirect=%2Fdashboard%2Frisk-assessment',
      );
    });
  });

  it.each([
    ['/dashboard', 'Dashboard page content'],
    ['/dashboard/risk-assessment', 'Risk assessment page content'],
    ['/kyc', 'KYC page content'],
    ['/change-password', 'Change password page content'],
  ])('renders authenticated protected content for %s inside the shell', (pathname, content) => {
    navigation.pathname = pathname;
    setFullSession();

    renderWithQueryClient(
      <AppLayout>
        <p>{content}</p>
      </AppLayout>
    );

    expect(screen.getByRole('main', { name: 'Application content' })).toHaveTextContent(content);
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

function setFullSession() {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'access-token',
      kycVerified: true,
      riskAssessed: false,
    });
  });
}
