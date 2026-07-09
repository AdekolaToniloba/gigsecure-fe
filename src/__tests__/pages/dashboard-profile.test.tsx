import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '@/app/(app)/layout';
import DashboardProfileError from '@/app/(app)/dashboard/profile/error';
import DashboardProfileLoading from '@/app/(app)/dashboard/profile/loading';
import DashboardProfilePage, { metadata } from '@/app/(app)/dashboard/profile/page';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { fullProfileResponseFixture } from '@/mocks/fixtures/profile';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const navigation = vi.hoisted(() => ({
  pathname: '/dashboard/profile',
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
}));

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;

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
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  navigation.pathname = '/dashboard/profile';
  navigation.searchParams = new URLSearchParams();
  navigation.replace.mockReset();
  act(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setSession({
      accessToken: 'dashboard-profile-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
  server.use(
    http.get(PROFILE_URL, () => HttpResponse.json(fullProfileResponseFixture)),
  );
});

describe('dashboard profile route', () => {
  it('defines route metadata', () => {
    expect(metadata.title).toBe('Profile');
    expect(metadata.description).toMatch(/personal information, risk data summary, and account security/i);
  });

  it('renders inside the authenticated shell with the active Profile navigation item and real tabs', async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <AppLayout>
        <DashboardProfilePage />
      </AppLayout>,
    );

    const appHeader = screen.getByRole('banner', { name: 'Application header' });
    const main = screen.getByRole('main', { name: 'Application content' });

    expect(within(appHeader).getByRole('search', { name: 'Dashboard search' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Profile' })[0]).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(main).toHaveAttribute('id', 'dashboard-content');
    expect(await within(main).findByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
    expect(within(main).getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      within(main).getByText('Manage your personal details, security and preferences'),
    ).toBeInTheDocument();
    expect(within(main).getByText('Test User')).toBeInTheDocument();
    expect(within(main).getByRole('tab', { name: 'Personal Information' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByText(/Notification preferences/i)).not.toBeInTheDocument();

    await user.click(within(main).getByRole('tab', { name: 'Security' }));
    expect(within(main).getByText('Password')).toBeInTheDocument();
    expect(within(main).getByText('Identity verification')).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('uses stable route loading geometry with an accessible status', () => {
    render(<DashboardProfileLoading />);

    const loading = screen.getByRole('status', { name: /loading profile/i });
    expect(loading).toHaveClass('max-w-7xl', 'min-w-0');
    expect(loading).toHaveTextContent('Loading profile');
  });

  it('shows the recoverable route error fallback without leaking internal details', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(
      <DashboardProfileError
        error={new Error('sensitive stack trace')}
        reset={reset}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something unexpected interrupted your profile page');
    expect(alert).not.toHaveTextContent('sensitive stack trace');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Reload profile' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders the page skeleton while the profile query is still loading', async () => {
    server.use(
      http.get(PROFILE_URL, async () => {
        await delay(150);
        return HttpResponse.json(fullProfileResponseFixture);
      }),
    );

    renderWithQueryClient(
      <AppLayout>
        <DashboardProfilePage />
      </AppLayout>,
    );

    expect(screen.getByRole('status', { name: /loading profile/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
    });
  });
});
