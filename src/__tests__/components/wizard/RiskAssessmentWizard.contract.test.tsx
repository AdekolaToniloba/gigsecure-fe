import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RiskAssessmentWizard } from '@/components/risk-assessment/wizard';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { server } from '@/mocks';
import {
  assessmentPayloadFixture,
  publicAssessmentResponseFixture,
  riskCategoriesFixture,
  riskErrorFixtures,
} from '@/mocks/fixtures/risk-assessment';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';
import { riskService } from '@/services/risk.service';
import { renderWithProviders } from '../../test-utils';
import type { AssessmentMode } from '@/lib/risk/assessment-route-context';

const submissionUrl = `http://localhost:8000${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY(':category')}`;
const categoriesUrl = `http://localhost:8000${ENDPOINTS.RISK.CATEGORIES}`;
const completePayload = { ...assessmentPayloadFixture, insurance_types: ['Health insurance'] };

function seedFinalStep(mode: AssessmentMode) {
  const store = useWizardStore.getState();
  store.setMode(mode);
  store.setSelectedCategory('tech_freelancer');
  store.setStepAnswers(completePayload);
  for (let step = 0; step < 5; step += 1) store.nextStep();
}

describe('RiskAssessmentWizard shared contract', () => {
  beforeEach(() => {
    act(() => {
      useWizardStore.getState().reset('public');
      useWizardStore.getState().reset('dashboard');
      useAuthStore.getState().setAccessToken('assessment-token');
    });
  });

  it.each<AssessmentMode>(['public', 'dashboard'])(
    'submits the same validated API payload in %s mode',
    async (mode) => {
      const bodies: unknown[] = [];
      server.use(http.post(submissionUrl, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(publicAssessmentResponseFixture, { status: 201 });
      }));
      act(() => seedFinalStep(mode));
      const onSuccess = vi.fn();

      renderWithProviders(
        <RiskAssessmentWizard
          mode={mode}
          onCancel={vi.fn()}
          onSuccess={onSuccess}
          onAuthenticationFailure={vi.fn()}
        />,
      );

      await userEvent.click(await screen.findByRole('button', { name: /submit assessment/i }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(publicAssessmentResponseFixture));
      expect(bodies).toEqual([completePayload]);
    },
  );

  it('delegates cancellation to its route adapter and announces progress', async () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <RiskAssessmentWizard
        mode="dashboard"
        onCancel={onCancel}
        onSuccess={vi.fn()}
        onAuthenticationFailure={vi.fn()}
      />,
    );

    await userEvent.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
  });

  it('keeps an invalid action keyboard-reachable and focuses the first invalid question', async () => {
    act(() => {
      const store = useWizardStore.getState();
      store.setMode('public');
      store.setSelectedCategory('tech_freelancer');
      store.nextStep();
    });
    renderWithProviders(
      <RiskAssessmentWizard
        mode="public"
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        onAuthenticationFailure={vi.fn()}
      />,
    );

    const next = await screen.findByRole('button', { name: /next/i });
    expect(next).not.toBeDisabled();
    await userEvent.click(next);
    await waitFor(() => expect(screen.getByText('What type of tech freelancing do you do?').parentElement).toHaveFocus());
  });

  it('renders a retryable query error and recovers without leaving the wizard', async () => {
    act(() => useWizardStore.getState().setMode('public'));
    const categories = vi.spyOn(riskService, 'getCategories').mockRejectedValueOnce(
      new Error('Categories unavailable'),
    );
    renderWithProviders(
      <RiskAssessmentWizard mode="public" onCancel={vi.fn()} onSuccess={vi.fn()} onAuthenticationFailure={vi.fn()} />,
    );

    const retry = await screen.findByRole('button', { name: /try again/i });
    categories.mockResolvedValueOnce(riskCategoriesFixture);
    await userEvent.click(retry);
    expect(await screen.findByText("Let's get to know you")).toBeInTheDocument();
    categories.mockRestore();
  });

  it('delegates authentication recovery instead of choosing a route', async () => {
    act(() => useWizardStore.getState().setMode('public'));
    const onAuthenticationFailure = vi.fn();
    server.use(http.get(categoriesUrl, () =>
      HttpResponse.json(riskErrorFixtures.expired, { status: 401 })
    ));
    renderWithProviders(
      <RiskAssessmentWizard mode="public" onCancel={vi.fn()} onSuccess={vi.fn()} onAuthenticationFailure={onAuthenticationFailure} />,
    );

    await waitFor(() => expect(onAuthenticationFailure).toHaveBeenCalledOnce());
  });
});
