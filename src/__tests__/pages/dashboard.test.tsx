import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import AppLayout from '@/app/(app)/layout';
import DashboardRouteError from '@/app/(app)/dashboard/error';
import DashboardLoading from '@/app/(app)/dashboard/loading';
import DashboardPage, { metadata } from '@/app/(app)/dashboard/page';
import { renderWithProviders } from '@/__tests__/test-utils';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  assessedDashboardOverview,
  dashboardProfileFixtures,
  latestAssessmentFixture,
  unassessedDashboardOverview,
} from '@/mocks/fixtures/dashboard';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const OVERVIEW_URL = `${BASE}${ENDPOINTS.DASHBOARD.OVERVIEW}`;
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;
const ASSESSMENT_URL = `${BASE}${ENDPOINTS.RISK.ASSESSMENT}`;
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

describe('Dashboard route', () => {
  it('exports meaningful route metadata', () => {
    expect(metadata.title).toBe('Dashboard');
    expect(metadata.description).toMatch(/financial risk overview/i);
  });

  it('composes the complete assessed page inside the authenticated shell', async () => {
    const user = userEvent.setup();
    setSession(false, true);
    server.use(
      http.get(OVERVIEW_URL, () => HttpResponse.json(assessedDashboardOverview)),
      http.get(PROFILE_URL, () =>
        HttpResponse.json(dashboardProfileFixtures.assessedKycUnverified)),
      http.get(ASSESSMENT_URL, () => HttpResponse.json(latestAssessmentFixture)),
    );

    renderWithProviders(
      <AppLayout>
        <DashboardPage />
      </AppLayout>,
    );

    const dashboardHeading = await screen.findByRole('heading', { name: 'Dashboard' });
    const kycBanner = screen.getByRole('status', { name: 'Verify your KYC' });
    expect(screen.getAllByRole('heading', { level: 1 })).toEqual([dashboardHeading]);
    expect(kycBanner.compareDocumentPosition(dashboardHeading))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText(/Oluwakanyinsola.*account overview/i)).toBeVisible();
    expect(screen.getByText((_, element) => element?.tagName === 'TIME')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Here’s your financial snapshot.' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Dashboard metrics' })).toHaveTextContent(
      '₦300,000–₦500,000 per month',
    );
    expect(screen.getByRole('region', { name: 'Income Stability Pattern' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Recommended actions' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveTextContent(
      'Notifications are not available yet',
    );
    expect(screen.getByRole('main', { name: 'Application content' })).toHaveAttribute(
      'id',
      'dashboard-content',
    );
    expect(screen.getByRole('link', { name: 'Skip to dashboard content' })).toHaveAttribute(
      'href',
      '#dashboard-content',
    );
    expect(screen.queryByRole('button', { name: /View Recommendations/i }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading dashboard overview' }))
      .not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open notifications' }));
    expect(await screen.findByRole('dialog', { name: 'Notifications' })).toHaveTextContent(
      'Notifications are not available yet',
    );
  });

  it('composes the unassessed empty state without a KYC reminder when verified', async () => {
    setSession(true, false);
    server.use(
      http.get(OVERVIEW_URL, () => HttpResponse.json(unassessedDashboardOverview)),
      http.get(PROFILE_URL, () =>
        HttpResponse.json(dashboardProfileFixtures.unassessedKycVerified)),
    );

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Lets get you protected' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Lets get started' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'No stability data yet' }).closest('[role="status"]')).toHaveTextContent(
      'Complete your risk assessment',
    );
    expect(screen.queryByRole('status', { name: 'Verify your KYC' }))
      .not.toBeInTheDocument();
  });

  it('uses dashboard-sized route loading geometry with an accessible status', () => {
    render(<DashboardLoading />);

    const loading = screen.getByRole('status', { name: 'Loading dashboard overview' });
    expect(loading).toBeVisible();
    expect(document.querySelectorAll('[data-dashboard-skeleton="metric"]')).toHaveLength(4);
    expect(loading.firstElementChild?.nextElementSibling).toHaveClass(
      'motion-reduce:[&_*]:animate-none',
    );
  });

  it('keeps unexpected route errors recoverable without exposing technical details', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(
      <DashboardRouteError
        error={new Error('sensitive internal stack detail')}
        reset={reset}
      />,
    );

    const alert = screen.getByRole('alert');
    const retry = screen.getByRole('button', { name: 'Reload dashboard' });
    expect(alert).toHaveTextContent('Something unexpected interrupted your dashboard');
    expect(alert).not.toHaveTextContent('sensitive internal stack detail');
    expect(alert.parentElement).toHaveClass('max-w-7xl', 'min-w-0');

    await user.tab();
    expect(retry).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
