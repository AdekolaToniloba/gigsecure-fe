import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardRiskAssessmentController } from '@/components/risk-assessment/dashboard/dashboard-risk-assessment-controller';
import { RiskAssessmentWizard } from '@/components/risk-assessment/wizard';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { QUERY_KEYS } from '@/lib/constants';
import {
  assessmentPayloadFixture,
  dashboardAssessmentResponseFixture,
  riskErrorFixtures,
} from '@/mocks/fixtures/risk-assessment';
import { server } from '@/mocks/server';
import { riskService } from '@/services/risk.service';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';

const router = { push: vi.fn(), replace: vi.fn() };

vi.mock('next/navigation', () => ({ useRouter: () => router }));

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;
const SUBMISSION_URL = `${BASE}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY(':category')}`;

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

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderWithClient(ui: React.ReactElement, queryClient = createQueryClient()) {
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

function seedFinalStep(mode: 'public' | 'dashboard') {
  const wizard = useWizardStore.getState();
  wizard.setMode(mode);
  wizard.setSelectedCategory('tech_freelancer');
  wizard.setStepAnswers({ ...assessmentPayloadFixture, insurance_types: ['Health insurance'] });
  wizard.setCurrentStep(5);
}

beforeEach(() => {
  vi.clearAllMocks();
  act(() => {
    useAuthStore.getState().clearAuth();
    useWizardStore.getState().reset('public');
    useWizardStore.getState().reset('dashboard');
  });
});

describe('mode-specific risk assessment submission', () => {
  it('synchronizes dashboard success without flashing the empty state or duplicating latest fetches', async () => {
    const user = userEvent.setup();
    let profileRequests = 0;
    let latestRequests = 0;
    server.use(
      http.get(PROFILE_URL, () => {
        profileRequests += 1;
        return HttpResponse.json({ ...profileFixture, risk_assessed: profileRequests > 1 });
      }),
      http.get(`${BASE}${ENDPOINTS.RISK.ASSESSMENT}`, () => {
        latestRequests += 1;
        return HttpResponse.json(dashboardAssessmentResponseFixture);
      }),
      http.post(SUBMISSION_URL, () =>
        HttpResponse.json(dashboardAssessmentResponseFixture, { status: 201 })),
    );
    act(() => useAuthStore.getState().setSession({
      accessToken: 'full-session-risk-token',
      kycVerified: true,
      riskAssessed: false,
    }));
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    renderWithClient(<DashboardRiskAssessmentController />, queryClient);

    await user.click(await screen.findByRole('button', { name: 'Take assessment' }));
    act(() => seedFinalStep('dashboard'));
    await user.click(await screen.findByRole('button', { name: /submit assessment/i }));

    expect(await screen.findByRole('heading', { name: /risk profile/i })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Take assessment' })).not.toBeInTheDocument();
    expect(queryClient.getQueryData(QUERY_KEYS.RISK_ASSESSMENT)).toEqual(
      dashboardAssessmentResponseFixture,
    );
    expect(useAuthStore.getState().riskAssessed).toBe(true);
    await waitFor(() => expect(useWizardStore.getState().progressByMode.dashboard.answers).toEqual({}));
    expect(latestRequests).toBe(0);
    for (const queryKey of [
      QUERY_KEYS.USER_ME,
      QUERY_KEYS.RISK_ASSESSMENT,
      QUERY_KEYS.RISK_HISTORY,
      QUERY_KEYS.RISK_RECOMMENDATIONS,
      QUERY_KEYS.DASHBOARD_OVERVIEW,
      QUERY_KEYS.MARKETPLACE_RECOMMENDATIONS(),
    ]) {
      expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey }));
    }
  });

  it('uses full-session recovery for a dashboard 401 and preserves resumable answers', async () => {
    const user = userEvent.setup();
    vi.spyOn(riskService, 'submitAssessment').mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Session expired.' } },
    });
    server.use(http.get(PROFILE_URL, () => HttpResponse.json(profileFixture)));
    act(() => useAuthStore.getState().setSession({
      accessToken: 'full-session-risk-token',
      kycVerified: true,
      riskAssessed: false,
    }));
    renderWithClient(<DashboardRiskAssessmentController />);

    await user.click(await screen.findByRole('button', { name: 'Take assessment' }));
    act(() => seedFinalStep('dashboard'));
    await user.click(await screen.findByRole('button', { name: /submit assessment/i }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(
      '/login?redirect=%2Fdashboard%2Frisk-assessment',
    ));
    expect(useWizardStore.getState().progressByMode.dashboard.currentStep).toBe(5);
    expect(useWizardStore.getState().progressByMode.dashboard.answers).toMatchObject({
      first_name: assessmentPayloadFixture.first_name,
      occupation: assessmentPayloadFixture.occupation,
      protection_priority: assessmentPayloadFixture.protection_priority,
    });
    expect(router.replace).not.toHaveBeenCalledWith(expect.stringContaining('/waitlist'));
  });

  it('maps a backend 422 to its field, focuses it, and retains all answers', async () => {
    server.use(http.post(SUBMISSION_URL, () => HttpResponse.json({
      detail: [{ loc: ['body', 'insurance_types'], msg: 'Choose a valid policy type', type: 'value_error' }],
    }, { status: 422 })));
    act(() => {
      useAuthStore.getState().setAccessToken('assessment-token');
      seedFinalStep('public');
    });
    renderWithClient(
      <RiskAssessmentWizard
        mode="public"
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        onAuthenticationFailure={vi.fn()}
      />,
    );

    await userEvent.click(await screen.findByRole('button', { name: /submit assessment/i }));

    expect((await screen.findAllByText('Choose a valid policy type')).length).toBeGreaterThan(0);
    expect(screen.getByText('What insurance do you currently have?').parentElement).toHaveFocus();
    expect(useWizardStore.getState().progressByMode.public.answers).toMatchObject({
      first_name: assessmentPayloadFixture.first_name,
      occupation: assessmentPayloadFixture.occupation,
      protection_priority: assessmentPayloadFixture.protection_priority,
      insurance_types: ['Health insurance'],
    });
  });

  it('announces a 500, retains answers, and allows a successful retry', async () => {
    const submitAssessment = vi.spyOn(riskService, 'submitAssessment')
      .mockRejectedValueOnce({ response: { status: 500, data: riskErrorFixtures.server } })
      .mockResolvedValueOnce(dashboardAssessmentResponseFixture);
    const onSuccess = vi.fn();
    act(() => {
      useAuthStore.getState().setAccessToken('assessment-token');
      seedFinalStep('public');
    });
    renderWithClient(
      <RiskAssessmentWizard mode="public" onCancel={vi.fn()} onSuccess={onSuccess} onAuthenticationFailure={vi.fn()} />,
    );

    await userEvent.click(await screen.findByRole('button', { name: /submit assessment/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Risk assessment service is temporarily unavailable.',
    );
    expect(useWizardStore.getState().progressByMode.public.currentStep).toBe(5);
    await userEvent.click(screen.getByRole('button', { name: /submit assessment/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(submitAssessment).toHaveBeenCalledTimes(2);
  });

  it('prevents duplicate submissions while the first request is pending', async () => {
    let submissions = 0;
    server.use(http.post(SUBMISSION_URL, async () => {
      submissions += 1;
      await delay(80);
      return HttpResponse.json(dashboardAssessmentResponseFixture, { status: 201 });
    }));
    act(() => {
      useAuthStore.getState().setAccessToken('assessment-token');
      seedFinalStep('public');
    });
    renderWithClient(
      <RiskAssessmentWizard mode="public" onCancel={vi.fn()} onSuccess={vi.fn()} onAuthenticationFailure={vi.fn()} />,
    );

    const submit = await screen.findByRole('button', { name: /submit assessment/i });
    await userEvent.dblClick(submit);

    expect(await screen.findByRole('status')).toHaveTextContent('Analyzing assessment');
    await waitFor(() => expect(submissions).toBe(1));
  });
});
