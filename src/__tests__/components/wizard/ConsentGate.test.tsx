import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsentGate from '@/app/(wizard)/assessment/_components/ConsentGate';
import { useWizardStore } from '@/store/wizard-store';
import type { AssessmentStep } from '@/types/risk-assessment';

const mockStep: AssessmentStep = {
  step: 4,
  title: 'Health & lifestyle',
  subtitle: 'Your health information helps us assess your wellbeing risk',
  consent_required: true,
  consent_text: 'I agree to provide basic health information for insurance assessment purposes.',
  questions: [],
};

describe('ConsentGate', () => {
  it('renders the step title and consent text', () => {
    render(<ConsentGate step={mockStep} />);
    expect(screen.getByText('Health & lifestyle')).toBeInTheDocument();
    expect(screen.getByText(/I agree to provide basic health information/)).toBeInTheDocument();
  });

  it('"Continue" button is disabled before checkbox is checked', () => {
    render(<ConsentGate step={mockStep} />);
    const continueBtn = screen.getByRole('button', { name: /continue to health questions/i });
    expect(continueBtn).toBeDisabled();
  });

  it('checking checkbox enables the "Continue" button', async () => {
    const user = userEvent.setup();
    render(<ConsentGate step={mockStep} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    const continueBtn = screen.getByRole('button', { name: /continue to health questions/i });
    expect(continueBtn).toBeEnabled();
  });

  it('clicking "Continue" sets healthConsent to true', async () => {
    const user = userEvent.setup();
    render(<ConsentGate step={mockStep} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    const continueBtn = screen.getByRole('button', { name: /continue to health questions/i });
    await user.click(continueBtn);

    expect(useWizardStore.getState().healthConsent).toBe(true);
  });

  it('"Cancel" calls prevStep', async () => {
    const user = userEvent.setup();
    // Set step to 3 so prevStep goes to 2
    useWizardStore.setState({ currentStep: 3 });

    render(<ConsentGate step={mockStep} />);
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    expect(useWizardStore.getState().currentStep).toBe(2);
  });
});
