import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { RiskDataSection } from '@/components/dashboard/profile/risk-data-section';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  dashboardAssessmentResponseFixture,
  malformedRiskFixtures,
} from '@/mocks/fixtures/risk-assessment';
import { fullProfileResponseFixture } from '@/mocks/fixtures/profile';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const LATEST_URL = `${BASE}${ENDPOINTS.RISK.ASSESSMENT}`;

function renderSection(
  ui: React.ReactElement,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setSession({
      accessToken: 'risk-data-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
});

describe('RiskDataSection', () => {
  it('shows a friendly empty state when the user has not completed an assessment', () => {
    renderSection(
      <RiskDataSection
        profileResponse={{ ...fullProfileResponseFixture, risk_assessed: false }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Risk data' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Take assessment' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );
  });

  it('shows an accessible loading state while the latest assessment is fetching', async () => {
    server.use(
      http.get(LATEST_URL, async () => {
        await delay(150);
        return HttpResponse.json(dashboardAssessmentResponseFixture);
      }),
    );

    renderSection(
      <RiskDataSection profileResponse={fullProfileResponseFixture} />,
    );

    expect(
      screen.getByRole('status', { name: 'Loading latest risk data' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Loading latest risk data')).toBeInTheDocument();
  });

  it('renders truthful grouped cards, scores, unsupported-field copy, and update actions', async () => {
    server.use(
      http.get(LATEST_URL, () => HttpResponse.json(dashboardAssessmentResponseFixture)),
    );

    renderSection(
      <RiskDataSection profileResponse={fullProfileResponseFixture} />,
    );

    expect(await screen.findByRole('heading', { name: 'Personal details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'You & your work' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Income & stability' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your risks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Health & lifestyle' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Safety net & insurance history' }),
    ).toBeInTheDocument();

    expect(screen.getByText('69%')).toBeInTheDocument();
    expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
    expect(screen.getByText('72 out of 100')).toBeInTheDocument();
    expect(screen.getAllByText('Not available from the current assessment summary.').length).toBeGreaterThan(3);
    expect(screen.getAllByRole('link', { name: 'Update' }).length).toBe(6);
    expect(screen.getByRole('heading', { name: 'Recommendations' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI insights' })).toBeInTheDocument();
    expect(screen.queryByText(/primary income source/i)).not.toBeInTheDocument();
  });

  it('shows API errors accessibly and retries the latest assessment query', async () => {
    const user = userEvent.setup();
    let requestCount = 0;

    server.use(
      http.get(LATEST_URL, () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json({ detail: 'Assessment service unavailable.' }, { status: 400 })
          : HttpResponse.json(dashboardAssessmentResponseFixture);
      }),
    );

    renderSection(
      <RiskDataSection profileResponse={fullProfileResponseFixture} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Assessment service unavailable.',
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Personal details' })).toBeInTheDocument();
    });
    expect(requestCount).toBe(2);
  });

  it('surfaces malformed latest-assessment responses instead of fabricating data', async () => {
    server.use(
      http.get(LATEST_URL, () => HttpResponse.json(malformedRiskFixtures.assessment)),
    );

    renderSection(
      <RiskDataSection profileResponse={fullProfileResponseFixture} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid API response shape in riskService.getLatestAssessment',
    );
    expect(screen.queryByText('69%')).not.toBeInTheDocument();
  });
});
