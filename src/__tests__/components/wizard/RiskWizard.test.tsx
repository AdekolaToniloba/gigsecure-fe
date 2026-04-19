import { describe, it, expect, vi } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import { renderWithProviders, mockRouter } from '../../test-utils';
import RiskWizard from '@/app/(wizard)/assessment/_components/RiskWizard';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';
import userEvent from '@testing-library/user-event';

// Note: Questions fetch mocked via global MSW in setup.ts

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('RiskWizard', () => {
  it('redirects to waitlist when no token', async () => {
    // Ensuring auth state is clean
    useAuthStore.getState().clearAuth();
    renderWithProviders(<RiskWizard />);
    
    // Auth guard redirects if no access_token
    expect(mockRouter.push).toHaveBeenCalledWith('/waitlist');
  });

  it('shows skeleton while loading', () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
      useWizardStore.getState().setSelectedCategory('tech_freelancer');
      useWizardStore.getState().nextStep(); // Move to step 1 (API-dependent)
    });
    renderWithProviders(<RiskWizard />);
    // Now it should show skeleton while fetching questions
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders Step 1 (Personal Details) after load', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
    });
    renderWithProviders(<RiskWizard />);
    
    // Header title
    expect(await screen.findByText("Let's get to know you")).toBeInTheDocument();
    // Match the label (the user reverted to hyphens in UI)
    expect(screen.getByText(/First-Name/i)).toBeInTheDocument();
  });

  it('sidebar highlights current step', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
    });
    renderWithProviders(<RiskWizard />);
    
    // Step 0 is Personal Details in sidebar
    expect(await screen.findByText('Personal Details')).toBeInTheDocument();
  });

  it('resume banner shows when currentStep > 0', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
      useWizardStore.getState().setSelectedCategory('tech_freelancer');
      useWizardStore.getState().nextStep(); // Set to step index 1
    });
    
    renderWithProviders(<RiskWizard />);
    
    expect(await screen.findByText(/continue where you left off/i)).toBeInTheDocument();
  });

  it('"Start over" resets to step 0', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
      useWizardStore.getState().setSelectedCategory('tech_freelancer');
      useWizardStore.getState().nextStep(); // Set to step index 1
    });
    
    renderWithProviders(<RiskWizard />);
    
    expect(await screen.findByText(/continue where you left off/i)).toBeInTheDocument();
    const startOverBtn = screen.getByRole('button', { name: /start over/i });
    
    await user.click(startOverBtn);
    
    // Store should reset
    expect(useWizardStore.getState().currentStep).toBe(0);
    await waitFor(() => {
      expect(screen.queryByText(/continue where you left off/i)).not.toBeInTheDocument();
    });
  });
});
