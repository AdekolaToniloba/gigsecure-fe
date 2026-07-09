import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient, renderWithProviders } from '@/__tests__/test-utils';
import { DashboardOverviewController } from '@/components/dashboard/dashboard-overview-controller';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  assessedDashboardOverview,
  dashboardProfileFixtures,
  latestAssessmentFixture,
  unassessedDashboardOverview,
} from '@/mocks/fixtures/dashboard';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import type { UserWithProfileResponse } from '@/types/api';
import type { DashboardOverviewResponse } from '@/types/dashboard';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const OVERVIEW_URL = `${BASE}${ENDPOINTS.DASHBOARD.OVERVIEW}`;
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;
const ASSESSMENT_URL = `${BASE}${ENDPOINTS.RISK.ASSESSMENT}`;
const FIXED_DATE = new Date('2026-07-07T13:00:00.000Z');
const AUTHENTICATED_TOKEN = 'eyJhbGciOiJub25lIn0.eyJzY29wZSI6ImF1dGhlbnRpY2F0ZWQifQ.signature';

function setSession(kycVerified: boolean, riskAssessed: boolean) {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: AUTHENTICATED_TOKEN,
      kycVerified,
      riskAssessed,
    });
  });
}

function useDashboardResponses(
  overview: DashboardOverviewResponse,
  profile: UserWithProfileResponse,
) {
  server.use(
    http.get(OVERVIEW_URL, () => HttpResponse.json(overview)),
    http.get(PROFILE_URL, () => HttpResponse.json(profile)),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DashboardOverviewController', () => {
  it('keeps stable loading geometry while authenticated data resolves and preserves focus', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: AUTHENTICATED_TOKEN,
        kycVerified: true,
        riskAssessed: false,
      });
    });
    server.use(
      http.get(PROFILE_URL, async () => {
        await delay(80);
        return HttpResponse.json(dashboardProfileFixtures.unassessedKycVerified);
      }),
      http.get(OVERVIEW_URL, async () => {
        await delay(80);
        return HttpResponse.json(unassessedDashboardOverview);
      }),
    );

    renderWithProviders(
      <>
        <button type="button">Before dashboard</button>
        <DashboardOverviewController date={FIXED_DATE} />
      </>,
    );
    screen.getByRole('button', { name: 'Before dashboard' }).focus();

    expect(screen.getByRole('status', { name: 'Loading dashboard overview' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Before dashboard' })).toHaveFocus();
  });

  it('announces an unresolved-profile failure and recovers through the keyboard retry', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: AUTHENTICATED_TOKEN,
        kycVerified: true,
        riskAssessed: false,
      });
    });
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json({ detail: 'Account details could not be loaded.' }, { status: 400 })),
      http.get(OVERVIEW_URL, () => HttpResponse.json(unassessedDashboardOverview)),
    );

    renderWithProviders(<DashboardOverviewController date={FIXED_DATE} />);

    const alert = await screen.findByRole('alert');
    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(alert).toHaveTextContent('Account details unavailable');
    expect(alert).toHaveTextContent('Account details could not be loaded.');
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();

    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json(dashboardProfileFixtures.unassessedKycVerified)),
    );
    await user.tab();
    expect(retry).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: 'Lets get you protected' })).toBeVisible();
  });

  it.each([
    {
      name: 'unassessed and KYC verified',
      overview: unassessedDashboardOverview,
      profile: dashboardProfileFixtures.unassessedKycVerified,
      kycVerified: true,
      riskAssessed: false,
      heading: 'Lets get you protected',
      banner: false,
      stability: 'No stability data yet',
    },
    {
      name: 'unassessed and KYC unverified',
      overview: unassessedDashboardOverview,
      profile: {
        ...dashboardProfileFixtures.unassessedKycVerified,
        kyc_verified: false,
      },
      kycVerified: false,
      riskAssessed: false,
      heading: 'Lets get you protected',
      banner: true,
      stability: 'No stability data yet',
    },
    {
      name: 'assessed and KYC verified',
      overview: assessedDashboardOverview,
      profile: {
        ...dashboardProfileFixtures.assessedKycUnverified,
        kyc_verified: true,
      },
      kycVerified: true,
      riskAssessed: true,
      heading: 'Here’s your financial snapshot.',
      banner: false,
      stability: 'Moderate Stability With Seasonal Income Variation — 42%',
    },
    {
      name: 'assessed and KYC unverified',
      overview: assessedDashboardOverview,
      profile: dashboardProfileFixtures.assessedKycUnverified,
      kycVerified: false,
      riskAssessed: true,
      heading: 'Here’s your financial snapshot.',
      banner: true,
      stability: 'Moderate Stability With Seasonal Income Variation — 42%',
    },
  ])('renders $name independently', async ({
    overview,
    profile,
    kycVerified,
    riskAssessed,
    heading,
    banner,
    stability,
  }) => {
    setSession(kycVerified, riskAssessed);
    useDashboardResponses(overview, profile);

    renderWithProviders(<DashboardOverviewController date={FIXED_DATE} />);

    expect(await screen.findByRole('heading', { name: heading })).toBeVisible();
    expect(screen.queryByRole('status', { name: 'Verify your KYC' }) !== null).toBe(banner);
    expect(screen.getByText(stability)).toBeVisible();
    expect(screen.getByText(/Good afternoon, Oluwakanyinsola/)).toBeVisible();
    expect(screen.getByText('Tuesday, 7 July 2026')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Dashboard metrics' })).toBeVisible();

    if (overview.has_assessment) {
      expect(await screen.findByRole('img', { name: /Moderate Risk, score 68.5 out of 100/ })).toBeVisible();
      expect(screen.getByTestId('income-stability-path')).toHaveAttribute('d');
      expect(screen.getByRole('region', { name: 'Notifications' })).toHaveTextContent(
        'Notifications are not available yet',
      );
    } else {
      expect(screen.getByRole('region', { name: 'Lets get started' })).toBeVisible();
      expect(screen.queryByRole('img', { name: /score .* out of 100/ })).not.toBeInTheDocument();
    }
  });

  it('deduplicates profile, overview, and assessment requests and starts them in parallel', async () => {
    setSession(true, true);
    const requests = { overview: 0, profile: 0, assessment: 0 };

    server.use(
      http.get(OVERVIEW_URL, async () => {
        requests.overview += 1;
        await delay(100);
        return HttpResponse.json(assessedDashboardOverview);
      }),
      http.get(PROFILE_URL, async () => {
        requests.profile += 1;
        await delay(100);
        return HttpResponse.json({
          ...dashboardProfileFixtures.assessedKycUnverified,
          kyc_verified: true,
        });
      }),
      http.get(ASSESSMENT_URL, async () => {
        requests.assessment += 1;
        await delay(100);
        return HttpResponse.json(latestAssessmentFixture);
      }),
    );
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardOverviewController date={FIXED_DATE} />
        <DashboardOverviewController date={FIXED_DATE} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(requests).toEqual({ overview: 1, profile: 1, assessment: 1 }));
    expect(screen.getAllByRole('status', { name: 'Loading dashboard overview' })).toHaveLength(2);
    expect((await screen.findAllByRole('heading', { name: 'Dashboard' }))).toHaveLength(2);
    expect(requests).toEqual({ overview: 1, profile: 1, assessment: 1 });
  });

  it('keeps the shell recoverable when overview loading fails and retries from the keyboard', async () => {
    const user = userEvent.setup();
    setSession(true, false);
    useDashboardResponses(unassessedDashboardOverview, dashboardProfileFixtures.unassessedKycVerified);
    server.use(
      http.get(OVERVIEW_URL, () =>
        HttpResponse.json({ detail: 'Overview could not be loaded.' }, { status: 400 })),
    );

    renderWithProviders(<DashboardOverviewController date={FIXED_DATE} />);

    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByRole('alert')).toHaveTextContent('Overview could not be loaded.');
    server.use(http.get(OVERVIEW_URL, () => HttpResponse.json(unassessedDashboardOverview)));

    await user.tab();
    expect(retry).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: 'Lets get you protected' })).toBeVisible();
  });

  it('isolates an assessment error from overview metrics and retries only the assessment', async () => {
    const user = userEvent.setup();
    setSession(true, true);
    useDashboardResponses(assessedDashboardOverview, {
      ...dashboardProfileFixtures.assessedKycUnverified,
      kyc_verified: true,
    });
    server.use(
      http.get(ASSESSMENT_URL, () =>
        HttpResponse.json({ detail: 'Latest assessment is unavailable.' }, { status: 404 })),
    );

    renderWithProviders(<DashboardOverviewController date={FIXED_DATE} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Latest assessment is unavailable.');
    expect(screen.getByRole('region', { name: 'Dashboard metrics' })).toHaveTextContent(
      '₦300,000–₦500,000 per month',
    );
    expect(screen.getByRole('region', { name: 'Income Stability Pattern' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeVisible();

    server.use(http.get(ASSESSMENT_URL, () => HttpResponse.json(latestAssessmentFixture)));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('img', { name: /Moderate Risk, score 68.5 out of 100/ })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Recommended actions' })).toBeVisible();
  });

  it('keeps assessed overview data visible while the latest assessment is loading', async () => {
    setSession(true, true);
    useDashboardResponses(assessedDashboardOverview, {
      ...dashboardProfileFixtures.assessedKycUnverified,
      kyc_verified: true,
    });
    let resolveAssessment: (() => void) | undefined;
    const assessmentResponse = new Promise<void>((resolve) => {
      resolveAssessment = resolve;
    });
    server.use(
      http.get(ASSESSMENT_URL, async () => {
        await assessmentResponse;
        return HttpResponse.json(latestAssessmentFixture);
      }),
    );

    renderWithProviders(<DashboardOverviewController date={FIXED_DATE} />);

    expect(await screen.findByRole('heading', {
      name: 'Here’s your financial snapshot.',
    })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Loading financial risk level' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Dashboard metrics' })).toHaveTextContent(
      '₦300,000–₦500,000 per month',
    );
    expect(screen.getByRole('region', { name: 'Income Stability Pattern' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Recommended actions' })).not.toBeInTheDocument();

    resolveAssessment?.();
    expect(await screen.findByRole('img', {
      name: /Moderate Risk, score 68.5 out of 100/,
    })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Recommended actions' })).toBeVisible();
  });

  it('uses overview state for presentation and refreshes profile once when flags still disagree', async () => {
    setSession(true, false);
    let profileRequests = 0;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    server.use(
      http.get(OVERVIEW_URL, () => HttpResponse.json(assessedDashboardOverview)),
      http.get(PROFILE_URL, () => {
        profileRequests += 1;
        return HttpResponse.json(dashboardProfileFixtures.unassessedKycVerified);
      }),
      http.get(ASSESSMENT_URL, () => HttpResponse.json(latestAssessmentFixture)),
    );

    renderWithProviders(<DashboardOverviewController date={FIXED_DATE} />);

    expect(await screen.findByRole('heading', { name: 'Here’s your financial snapshot.' })).toBeVisible();
    await waitFor(() => expect(profileRequests).toBe(2));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Overview assessment state differs'),
    );
    expect(useAuthStore.getState().riskAssessed).toBe(false);
  });

  it('keeps the success layout mobile-first and free of fixed-width content tracks', async () => {
    setSession(true, false);
    useDashboardResponses(unassessedDashboardOverview, dashboardProfileFixtures.unassessedKycVerified);

    renderWithProviders(<DashboardOverviewController date={FIXED_DATE} />);

    await screen.findByRole('heading', { name: 'Lets get you protected' });
    const stability = screen.getByRole('region', { name: 'Income Stability Pattern' });
    expect(stability.parentElement).toHaveClass('grid-cols-1', 'min-w-0');
    expect(stability.parentElement).toHaveClass('lg:grid-cols-2');
  });
});
