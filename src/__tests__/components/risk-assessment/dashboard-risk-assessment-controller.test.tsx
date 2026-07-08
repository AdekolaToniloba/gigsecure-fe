import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/__tests__/test-utils';
import { DashboardRiskAssessmentController } from '@/components/risk-assessment/dashboard/dashboard-risk-assessment-controller';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  dashboardAssessmentResponseFixture,
  riskCategoriesFixture,
} from '@/mocks/fixtures/risk-assessment';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;
const LATEST_URL = `${BASE}${ENDPOINTS.RISK.ASSESSMENT}`;
const CATEGORIES_URL = `${BASE}${ENDPOINTS.RISK.CATEGORIES}`;

const profileFixture = {
  user: {
    id: '00000000-0000-4000-8000-000000000042',
    email: 'amara@example.com',
    first_name: 'Amara',
    last_name: 'Okafor',
    status: 'active',
    role: 'user',
    email_verified: true,
    phone_number: null,
    last_login_at: null,
    created_at: '2026-07-08T08:00:00Z',
  },
  profile: {
    date_of_birth: '1994-04-12',
    gender: 'female',
    state: 'Lagos',
    city: 'Ikeja',
    occupation: 'tech_freelancer',
  },
  kyc_verified: true,
  risk_assessed: false,
} as const;

function setFullSession(riskAssessed: boolean) {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'full-session-risk-token',
      kycVerified: true,
      riskAssessed,
    });
  });
}

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
    useWizardStore.getState().reset('dashboard');
  });
});

describe('DashboardRiskAssessmentController', () => {
  it('keeps stable loading geometry while full-session profile flags resolve', async () => {
    setFullSession(false);
    server.use(
      http.get(PROFILE_URL, async () => {
        await delay(80);
        return HttpResponse.json(profileFixture);
      }),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    expect(screen.getByRole('status', { name: 'Loading risk assessment' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Risk assessment' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Risk assessment' })).toBeVisible();
  });

  it('skips latest assessment for an authoritative false profile flag', async () => {
    setFullSession(false);
    let latestRequests = 0;
    server.use(
      http.get(PROFILE_URL, () => HttpResponse.json(profileFixture)),
      http.get(LATEST_URL, () => {
        latestRequests += 1;
        return HttpResponse.json(dashboardAssessmentResponseFixture);
      }),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    expect(await screen.findByRole('button', { name: 'Take assessment' })).toBeVisible();
    expect(latestRequests).toBe(0);
  });

  it('opens the dashboard-mode shared wizard with profile defaults and restores focus on cancel', async () => {
    const user = userEvent.setup();
    setFullSession(false);
    server.use(
      http.get(PROFILE_URL, () => HttpResponse.json(profileFixture)),
      http.get(CATEGORIES_URL, () => HttpResponse.json(riskCategoriesFixture)),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    const startButton = await screen.findByRole('button', { name: 'Take assessment' });
    await user.click(startButton);

    expect(await screen.findByRole('heading', { name: "Let's get to know you" })).toBeVisible();
    expect(screen.getByLabelText(/First-Name/)).toHaveValue('Amara');
    expect(screen.getByLabelText(/Last-Name/)).toHaveValue('Okafor');
    expect(screen.queryByText(/waitlist/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('button', { name: 'Take assessment' })).toHaveFocus();
    expect(useWizardStore.getState().progressByMode.dashboard.currentStep).toBe(0);
  });

  it('shows parsed profile errors and retries without leaving the dashboard state', async () => {
    const user = userEvent.setup();
    setFullSession(false);
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json({ detail: 'Account details could not be loaded.' }, { status: 400 })),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Account details could not be loaded.');
    server.use(http.get(PROFILE_URL, () => HttpResponse.json(profileFixture)));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Take assessment' })).toBeVisible();
  });

  it('loads the canonical latest assessment only for an assessed profile', async () => {
    setFullSession(true);
    let latestRequests = 0;
    server.use(
      http.get(PROFILE_URL, () => HttpResponse.json({ ...profileFixture, risk_assessed: true })),
      http.get(LATEST_URL, () => {
        latestRequests += 1;
        return HttpResponse.json(dashboardAssessmentResponseFixture);
      }),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    expect(await screen.findByRole('heading', { name: /risk profile/i })).toBeVisible();
    expect(screen.getByText('Moderate Risk')).toBeVisible();
    expect(screen.getByText('Overall score: 68.5 out of 100')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Take assessment' })).not.toBeInTheDocument();
    expect(latestRequests).toBe(1);
  });

  it('starts independent profile and latest requests together for a resolved assessed session', async () => {
    setFullSession(true);
    const requests = { profile: 0, latest: 0 };
    server.use(
      http.get(PROFILE_URL, async () => {
        requests.profile += 1;
        await delay(80);
        return HttpResponse.json({ ...profileFixture, risk_assessed: true });
      }),
      http.get(LATEST_URL, async () => {
        requests.latest += 1;
        await delay(80);
        return HttpResponse.json(dashboardAssessmentResponseFixture);
      }),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    await waitFor(() => expect(requests).toEqual({ profile: 1, latest: 1 }));
    expect(screen.getByRole('status', { name: 'Loading risk assessment' })).toBeVisible();
    expect(await screen.findByText('Overall score: 68.5 out of 100')).toBeVisible();
  });

  it('reconciles a true profile flag with a missing latest assessment on retry', async () => {
    const user = userEvent.setup();
    setFullSession(true);
    let profileRequests = 0;
    server.use(
      http.get(PROFILE_URL, () => {
        profileRequests += 1;
        return HttpResponse.json({ ...profileFixture, risk_assessed: true });
      }),
      http.get(LATEST_URL, () =>
        HttpResponse.json({ detail: 'No risk assessment found' }, { status: 404 })),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Assessment record needs attention');
    server.use(http.get(LATEST_URL, () => HttpResponse.json(dashboardAssessmentResponseFixture)));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: /risk profile/i })).toBeVisible();
    await waitFor(() => expect(profileRequests).toBe(2));
  });

  it('keeps non-404 latest failures retryable and section-local', async () => {
    const user = userEvent.setup();
    setFullSession(true);
    server.use(
      http.get(PROFILE_URL, () => HttpResponse.json({ ...profileFixture, risk_assessed: true })),
      http.get(LATEST_URL, () =>
        HttpResponse.json({ detail: 'Risk report could not be loaded.' }, { status: 400 })),
    );

    renderWithProviders(<DashboardRiskAssessmentController />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Risk report could not be loaded.',
    );
    server.use(http.get(LATEST_URL, () => HttpResponse.json(dashboardAssessmentResponseFixture)));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Overall score: 68.5 out of 100')).toBeVisible();
  });
});
