import { act, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '@/app/(app)/layout';
import DashboardRiskAssessmentRouteError from '@/app/(app)/dashboard/risk-assessment/error';
import DashboardRiskAssessmentLoading from '@/app/(app)/dashboard/risk-assessment/loading';
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
    expect(metadata.description).toMatch(/protected dashboard/i);
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

  it('uses stable route loading geometry with an accessible status', () => {
    render(<DashboardRiskAssessmentLoading />);

    const loading = screen.getByRole('status', { name: 'Loading risk assessment' });
    expect(loading).toHaveClass('max-w-7xl', 'min-w-0');
    expect(loading).toHaveTextContent('Loading risk assessment');
    expect(loading.lastElementChild?.lastElementChild).toHaveClass('min-h-[34rem]');
    expect(loading.firstElementChild?.nextElementSibling).toHaveClass(
      'motion-reduce:[&_*]:animate-none',
    );
  });

  it('keeps unexpected route errors recoverable without exposing technical details', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(
      <DashboardRiskAssessmentRouteError
        error={new Error('sensitive internal stack detail')}
        reset={reset}
      />,
    );

    const alert = screen.getByRole('alert');
    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Risk assessment');
    expect(alert).toHaveTextContent('Something unexpected interrupted your risk assessment');
    expect(alert).not.toHaveTextContent('sensitive internal stack detail');
    expect(alert.closest('section[aria-labelledby]')).toHaveClass('max-w-7xl', 'min-w-0');

    await user.tab();
    expect(retry).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(reset).toHaveBeenCalledTimes(1);
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
