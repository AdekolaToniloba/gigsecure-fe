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
    useAuthStore.getState().setAccessToken('mock-token');
    renderWithProviders(<RiskWizard />);
    // StepSkeleton doesn't have a testId. Just check for animate-pulse wrapper
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders Step 1 after load', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
    });
    renderWithProviders(<RiskWizard />);
    
    // We get multiple "You & your work" (one in sidebar, one in header)
    expect((await screen.findAllByText('You & your work')).length).toBeGreaterThan(0);
    expect(screen.getByText('What type of tech freelancing do you do?')).toBeInTheDocument();
  });

  it('sidebar highlights current step', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
    });
    renderWithProviders(<RiskWizard />);
    
    await screen.findAllByText('You & your work');
    expect(screen.getAllByText('You & your work').length).toBeGreaterThan(1);
  });

  it('resume banner shows when currentStep > 0', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
      useWizardStore.getState().nextStep(); // Set to step index 1
    });
    
    renderWithProviders(<RiskWizard />);
    
    expect(await screen.findByText(/continue where you left off/i)).toBeInTheDocument();
  });

  it('"Start over" resets to step 0', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setAccessToken('mock-token');
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
