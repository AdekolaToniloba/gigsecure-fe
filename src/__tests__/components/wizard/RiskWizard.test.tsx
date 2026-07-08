import { beforeEach, describe, it, expect, vi } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import { renderWithProviders, mockRouter } from '../../test-utils';
import PublicAssessmentController from '@/app/(wizard)/assessment/_components/public-assessment-controller';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks';
import { riskHandlerScenarios } from '@/mocks/handlers/risk';
import {
  assessmentPayloadFixture,
  WAITLIST_RISK_ACCESS_TOKEN,
} from '@/mocks/fixtures/risk-assessment';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Note: Questions fetch mocked via global MSW in setup.ts

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('RiskWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useWizardStore.getState().reset('public');
      useWizardStore.getState().reset('dashboard');
      useWizardStore.getState().setMode('public');
    });
  });

  it('redirects to waitlist when no token', async () => {
    // Ensuring auth state is clean
    useAuthStore.getState().clearAuth();
    renderWithProviders(<PublicAssessmentController />);
    
    // Auth guard redirects if no access_token
    expect(mockRouter.push).toHaveBeenCalledWith('/waitlist');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/login');
  });

  it('shows skeleton while loading', () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
      useWizardStore.getState().setSelectedCategory('tech_freelancer');
      useWizardStore.getState().nextStep(); // Move to step 1 (API-dependent)
    });
    renderWithProviders(<PublicAssessmentController />);
    // Now it should show skeleton while fetching questions
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders Step 1 (Personal Details) after load', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
    });
    renderWithProviders(<PublicAssessmentController />);
    
    // Header title
    expect(await screen.findByText("Let's get to know you")).toBeInTheDocument();
    // Match the label (the user reverted to hyphens in UI)
    expect(screen.getByText(/First-Name/i)).toBeInTheDocument();
  });

  it('sidebar highlights current step', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
    });
    renderWithProviders(<PublicAssessmentController />);
    
    // Step 0 is Personal Details in sidebar
    expect(await screen.findByText('Personal Details')).toBeInTheDocument();
  });

  it('resume banner shows when currentStep > 0', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
      useWizardStore.getState().setSelectedCategory('tech_freelancer');
      useWizardStore.getState().nextStep(); // Set to step index 1
    });
    
    renderWithProviders(<PublicAssessmentController />);
    
    expect(await screen.findByText(/continue where you left off/i)).toBeInTheDocument();
  });

  it('"Start over" resets to step 0', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
      useWizardStore.getState().setSelectedCategory('tech_freelancer');
      useWizardStore.getState().nextStep(); // Set to step index 1
    });
    
    renderWithProviders(<PublicAssessmentController />);
    
    expect(await screen.findByText(/continue where you left off/i)).toBeInTheDocument();
    const startOverBtn = screen.getByRole('button', { name: /start over/i });
    
    await user.click(startOverBtn);
    
    // Store should reset
    expect(useWizardStore.getState().currentStep).toBe(0);
    await waitFor(() => {
      expect(screen.queryByText(/continue where you left off/i)).not.toBeInTheDocument();
    });
  });

  it('sends a backend-rejected waitlist token to expired recovery without login', async () => {
    server.use(riskHandlerScenarios.categories.backendUnauthorized);
    act(() => useAuthStore.getState().setAccessToken(WAITLIST_RISK_ACCESS_TOKEN));

    renderWithProviders(<PublicAssessmentController />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/waitlist?expired=true');
    });
    expect(mockRouter.push).not.toHaveBeenCalledWith(expect.stringContaining('/login'));
    expect(mockRouter.push).not.toHaveBeenCalledWith('/waitlist');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('renders the public report from the validated 201 response without full-session requests', async () => {
    const forbiddenRequests: string[] = [];
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
    for (const endpoint of [
      ENDPOINTS.USERS.ME,
      ENDPOINTS.RISK.ASSESSMENT,
      ENDPOINTS.RISK.HISTORY,
      ENDPOINTS.RISK.RECOMMENDATIONS,
      ENDPOINTS.DASHBOARD.OVERVIEW,
      ENDPOINTS.MARKETPLACE.RECOMMENDATIONS,
    ]) {
      server.use(http.get(`${base}${endpoint}`, ({ request }) => {
        forbiddenRequests.push(new URL(request.url).pathname);
        return HttpResponse.json({}, { status: 500 });
      }));
    }
    act(() => seedCompletedAnswers());

    renderWithProviders(<PublicAssessmentController />);
    await userEvent.click(await screen.findByRole('button', { name: /submit assessment/i }));

    expect(await screen.findByRole('heading', { name: /protection plan/i })).toBeInTheDocument();
    expect(forbiddenRequests).toEqual([]);
    expect(useAuthStore.getState().hasFullSession).toBe(false);
    expect(useAuthStore.getState().riskAssessed).toBeNull();
    expect(useWizardStore.getState().progressByMode.public.currentStep).toBe(0);
    expect(useWizardStore.getState().progressByMode.public.answers).toEqual({});
  });

  it('uses public expired recovery when submission returns 401', async () => {
    server.use(riskHandlerScenarios.submission.unauthorized);
    act(() => seedCompletedAnswers());

    renderWithProviders(<PublicAssessmentController />);
    await userEvent.click(await screen.findByRole('button', { name: /submit assessment/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/waitlist?expired=true');
    });
    expect(mockRouter.push).not.toHaveBeenCalledWith('/waitlist');
    expect(useWizardStore.getState().progressByMode.public.currentStep).toBe(5);
    expect(useWizardStore.getState().progressByMode.public.answers).toMatchObject({
      first_name: assessmentPayloadFixture.first_name,
      occupation: assessmentPayloadFixture.occupation,
      protection_priority: assessmentPayloadFixture.protection_priority,
    });
  });

  it('reports and consumes waitlist-to-assessment handoff timing once', async () => {
    const gtag = vi.fn();
    Object.assign(window, { gtag });
    sessionStorage.setItem('gs_waitlist_handoff_start_ms', '1');
    act(() => useAuthStore.getState().setAccessToken(WAITLIST_RISK_ACCESS_TOKEN));

    renderWithProviders(<PublicAssessmentController />);

    await waitFor(() => expect(gtag).toHaveBeenCalledWith(
      'event',
      'waitlist_to_assessment_handoff',
      expect.objectContaining({ handoff_duration_ms: expect.any(Number) }),
    ));
    expect(sessionStorage.getItem('gs_waitlist_handoff_start_ms')).toBeNull();
  });
});

function seedCompletedAnswers() {
  useAuthStore.getState().setAccessToken(WAITLIST_RISK_ACCESS_TOKEN);
  const wizard = useWizardStore.getState();
  wizard.setMode('public');
  wizard.setSelectedCategory('tech_freelancer');
  wizard.setStepAnswers({
    ...assessmentPayloadFixture,
    insurance_types: ['Health insurance'],
  });
  for (let step = 0; step < 5; step += 1) wizard.nextStep();
}
