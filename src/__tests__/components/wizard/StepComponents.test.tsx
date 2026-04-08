import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockRouter } from '../../test-utils';
import StepYourWork from '@/app/(wizard)/assessment/_components/steps/StepYourWork';
import StepSafetyNet from '@/app/(wizard)/assessment/_components/steps/StepSafetyNet';

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

import { mockQuestionsResponse } from '../../fixtures/mockQuestions';
import { useWizardStore } from '@/store/wizard-store';

describe('StepComponents', () => {
  describe('StepYourWork (First step)', () => {
    const stepData = mockQuestionsResponse.steps[0];

    it('renders questions from step data', () => {
      renderWithProviders(<StepYourWork step={stepData} />);
      expect(screen.getByText('What type of tech freelancing do you do?')).toBeInTheDocument();
      expect(screen.getByText('How long have you been freelancing?')).toBeInTheDocument();
    });

    it('requires valid submission state to click Next', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StepYourWork step={stepData} />);
      
      const nextBtn = screen.getByRole('button', { name: /next →/i });
      expect(nextBtn).toBeDisabled();
      
      // Select an option
      await user.click(screen.getByText('Web Development'));
      
      // Still disabled because other fields are required
      expect(nextBtn).toBeDisabled();
    });

    it('preserves previous answers as defaults', () => {
      // Pre-fill store
      useWizardStore.getState().setStepAnswers({ job_type: 'Mobile Development' });
      
      renderWithProviders(<StepYourWork step={stepData} />);
      
      const selected = screen.getByRole('radio', { name: /Mobile Development/i });
      expect(selected).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('StepSafetyNet (Last step)', () => {
    const stepData = mockQuestionsResponse.steps[4];

    it('renders Submit Assessment button', () => {
      renderWithProviders(<StepSafetyNet step={stepData} isSubmitting={false} onSubmit={vi.fn()} />);
      expect(screen.getByRole('button', { name: /submit assessment/i })).toBeInTheDocument();
    });

    it('isSubmitting=true changes button text and disables it', () => {
      renderWithProviders(<StepSafetyNet step={stepData} isSubmitting={true} onSubmit={vi.fn()} />);
      const btn = screen.getByRole('button', { name: /analyzing/i });
      expect(btn).toBeDisabled();
    });

    it('calls onSubmit with merged answers on valid submit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      // Mock previous step answers
      useWizardStore.getState().setStepAnswers({ previous_q: 'X' });
      
      renderWithProviders(<StepSafetyNet step={stepData} isSubmitting={false} onSubmit={onSubmit} />);
      
      // We need to fill all form fields to make it valid
      // This step has: survival_3_months, savings_duration, insurance_types, insurance_claims, protection_priority
      await user.click(screen.getByText('No')); // survival_3_months
      await user.click(screen.getByText('1-2 months')); // savings_duration
      await user.click(screen.getByText('Health insurance')); // insurance_types (multi)
      await user.click(screen.getByText('Never')); // insurance_claims
      await user.click(screen.getByText('Income protection')); // protection_priority
      
      const btn = screen.getByRole('button', { name: /submit assessment/i });
      expect(btn).not.toBeDisabled(); // Validated!
      
      await user.click(btn);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
          previous_q: 'X',
          survival_3_months: expect.anything(),
          insurance_types: ['Health insurance'],
        }));
      });
    });
  });
});
