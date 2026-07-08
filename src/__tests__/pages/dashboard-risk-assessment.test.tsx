import { act, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '@/app/(app)/layout';
import DashboardRiskAssessmentPage, {
  metadata,
} from '@/app/(app)/dashboard/risk-assessment/page';
import { useAuthStore } from '@/store/auth-store';

const navigation = vi.hoisted(() => ({
  pathname: '/dashboard/risk-assessment',
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
  navigation.replace.mockReset();
  act(() => useAuthStore.getState().clearAuth());
});

describe('dashboard risk assessment route', () => {
  it('defines route metadata', () => {
    expect(metadata.title).toBe('Risk Assessment');
  });

  it('renders inside the authenticated shell with active navigation and no standalone header', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'full-session-token',
        kycVerified: true,
        riskAssessed: false,
      });
    });

    renderWithQueryClient(
      <AppLayout>
        <DashboardRiskAssessmentPage />
      </AppLayout>,
    );

    const appHeader = screen.getByRole('banner', { name: 'Application header' });
    const main = screen.getByRole('main', { name: 'Application content' });
    expect(within(appHeader).getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Risk Assessment' })).not.toHaveLength(0);
    expect(screen.getAllByRole('link', { name: 'Risk Assessment' })[0]).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(main).toHaveAttribute('id', 'dashboard-content');
    expect(await within(main).findByRole('heading', { level: 1, name: 'Risk assessment' })).toBeInTheDocument();
    expect(within(main).getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /cancel and return to home/i })).not.toBeInTheDocument();
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
    </QueryClientProvider>,
  );
}
