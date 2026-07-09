import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardRiskAssessmentController } from '@/components/risk-assessment/dashboard/dashboard-risk-assessment-controller';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { QUERY_KEYS } from '@/lib/constants';
import {
  assessmentPayloadFixture,
  dashboardAssessmentResponseFixture,
  riskErrorFixtures,
} from '@/mocks/fixtures/risk-assessment';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;
const LATEST_URL = `${BASE}${ENDPOINTS.RISK.ASSESSMENT}`;
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
  risk_assessed: true,
} as const;

const updatedAssessment = {
  ...dashboardAssessmentResponseFixture,
  applicant: {
    ...dashboardAssessmentResponseFixture.applicant,
    first_name: 'Updated',
  },
  overall_score: 42,
  risk_profile: 'Updated Risk Profile',
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderController(queryClient = createQueryClient()) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <DashboardRiskAssessmentController />
      </QueryClientProvider>,
    ),
  };
}

function seedFinalStep() {
  const wizard = useWizardStore.getState();
  wizard.setMode('dashboard');
  wizard.setSelectedCategory('tech_freelancer');
  wizard.setStepAnswers({ ...assessmentPayloadFixture, insurance_types: ['Health insurance'] });
  wizard.setCurrentStep(5);
}

async function openReassessment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Update assessment' }));
  const dialog = screen.getByRole('alertdialog', { name: 'Start a new assessment?' });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(screen.getByRole('button', { name: 'Keep current report' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Start new assessment' }));
  expect(await screen.findByRole('status')).toHaveTextContent("You're updating your assessment");
}

beforeEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/dashboard/risk-assessment');
  act(() => {
    useAuthStore.getState().clearAuth();
    useWizardStore.getState().reset('public');
    useWizardStore.getState().reset('dashboard');
    useAuthStore.getState().setSession({
      accessToken: 'full-session-risk-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
  server.use(
    http.get(PROFILE_URL, () => HttpResponse.json(profileFixture)),
    http.get(LATEST_URL, () => HttpResponse.json(dashboardAssessmentResponseFixture)),
  );
});

describe('dashboard reassessment flow', () => {
  it('requires confirmation, traps focus, and dismisses without changing progress', async () => {
    const user = userEvent.setup();
    act(() => {
      useWizardStore.getState().setMode('dashboard');
      useWizardStore.getState().setStepAnswers({ unfinished: 'keep me' });
      useWizardStore.getState().setCurrentStep(3);
    });
    renderController();

    const updateButton = await screen.findByRole('button', { name: 'Update assessment' });
    expect(updateButton).toHaveClass('w-full', 'sm:w-auto');
    await user.click(updateButton);

    expect(document.body.style.overflow).toBe('hidden');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Start new assessment' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(updateButton).toHaveFocus();
    expect(document.body.style.overflow).toBe('');

    await user.click(updateButton);
    await user.click(screen.getByRole('button', { name: 'Keep current report' }));
    expect(updateButton).toHaveFocus();
    expect(useWizardStore.getState().progressByMode.dashboard).toMatchObject({
      currentStep: 3,
      answers: { unfinished: 'keep me' },
    });
  });

  it('starts clean only after confirmation and cancel restores the cached report and focus', async () => {
    const user = userEvent.setup();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    act(() => {
      useWizardStore.getState().setMode('dashboard');
      useWizardStore.getState().setStepAnswers({ unfinished: 'discard me' });
      useWizardStore.getState().setCurrentStep(4);
    });
    const { queryClient } = renderController();
    await screen.findByRole('button', { name: 'Update assessment' });
    const reset = vi.spyOn(useWizardStore.getState(), 'reset');

    await openReassessment(user);

    expect(reset).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledWith('dashboard');
    expect(useWizardStore.getState().progressByMode.dashboard).toMatchObject({
      currentStep: 0,
      answers: {},
      selectedCategory: null,
    });
    expect(window.history.state).toMatchObject({ gigsecureReassessment: true });
    expect(screen.queryByText('Moderate Risk')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('button', { name: 'Update assessment' })).toHaveFocus();
    expect(screen.getByText('Moderate Risk')).toBeVisible();
    expect(queryClient.getQueryData(QUERY_KEYS.RISK_ASSESSMENT)).toEqual(
      dashboardAssessmentResponseFixture,
    );
    expect(useAuthStore.getState().riskAssessed).toBe(true);
    expect(historyBack).toHaveBeenCalledOnce();
  });

  it('treats browser Back as reassessment cancellation without altering the cached report', async () => {
    const user = userEvent.setup();
    const { queryClient } = renderController();
    await openReassessment(user);

    act(() => window.dispatchEvent(new PopStateEvent('popstate')));

    expect(await screen.findByRole('button', { name: 'Update assessment' })).toHaveFocus();
    expect(screen.getByText('Moderate Risk')).toBeVisible();
    expect(queryClient.getQueryData(QUERY_KEYS.RISK_ASSESSMENT)).toEqual(
      dashboardAssessmentResponseFixture,
    );
    expect(useAuthStore.getState().riskAssessed).toBe(true);
  });

  it('retains reassessment answers on error, then replaces the report on success and refresh', async () => {
    const user = userEvent.setup();
    vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    let latestRequests = 0;
    let submissions = 0;
    server.use(
      http.get(LATEST_URL, () => {
        latestRequests += 1;
        return HttpResponse.json(latestRequests > 1 ? updatedAssessment : dashboardAssessmentResponseFixture);
      }),
      http.post(SUBMISSION_URL, () => {
        submissions += 1;
        return submissions === 1
          ? HttpResponse.json(riskErrorFixtures.server, { status: 400 })
          : HttpResponse.json(updatedAssessment, { status: 201 });
      }),
    );
    const firstRender = renderController();
    const invalidate = vi.spyOn(firstRender.queryClient, 'invalidateQueries');
    await openReassessment(user);
    expect(latestRequests).toBe(1);
    act(() => seedFinalStep());

    await user.click(await screen.findByRole('button', { name: /submit assessment/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Risk assessment service is temporarily unavailable.',
    );
    expect(useWizardStore.getState().progressByMode.dashboard.currentStep).toBe(5);
    expect(firstRender.queryClient.getQueryData(QUERY_KEYS.RISK_ASSESSMENT)).toEqual(
      dashboardAssessmentResponseFixture,
    );

    await user.click(screen.getByRole('button', { name: /submit assessment/i }));

    expect(await screen.findByRole('heading', { name: /Updated.*risk profile/i })).toHaveFocus();
    expect(screen.getByText('Updated Risk Profile')).toBeVisible();
    expect(firstRender.queryClient.getQueryData(QUERY_KEYS.RISK_ASSESSMENT)).toEqual(
      updatedAssessment,
    );
    expect(useAuthStore.getState().riskAssessed).toBe(true);
    await waitFor(() => expect(useWizardStore.getState().progressByMode.dashboard.answers).toEqual({}));
    expect(latestRequests).toBe(1);
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

    firstRender.unmount();
    renderController();

    expect(await screen.findByText('Updated Risk Profile')).toBeVisible();
    expect(latestRequests).toBe(2);
  });
});
