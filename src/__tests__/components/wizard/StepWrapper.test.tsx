import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepWrapper from '@/app/(wizard)/assessment/_components/steps/StepWrapper';
import { WizardNavigationProvider } from '@/components/risk-assessment/wizard/risk-assessment-wizard-context';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('StepWrapper', () => {
  const onCancel = vi.fn();
  const renderStep = (ui: React.ReactNode) => render(
    <WizardNavigationProvider value={{ onCancel, stepNumber: 2, totalSteps: 6, focusQuestion: vi.fn() }}>
      {ui}
    </WizardNavigationProvider>,
  );
  const defaultProps = {
    title: 'Test Step',
    subtitle: 'A test description',
    children: <p>Step content</p>,
    onNext: vi.fn(),
    onBack: vi.fn(),
    isFirstStep: false,
    isLastStep: false,
  };

  it('renders title and subtitle', () => {
    renderStep(<StepWrapper {...defaultProps} />);
    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderStep(<StepWrapper {...defaultProps} />);
    expect(screen.getByText('Step content')).toBeInTheDocument();
  });

  it('shows "Cancel" on the first step (no "Back")', () => {
    renderStep(<StepWrapper {...defaultProps} isFirstStep={true} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
  });

  it('shows "Back" on non-first steps (no "Cancel")', () => {
    renderStep(<StepWrapper {...defaultProps} isFirstStep={false} />);
    expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('shows "Submit Assessment" text on last step', () => {
    renderStep(<StepWrapper {...defaultProps} isLastStep={true} />);
    expect(screen.getByText('Submit Assessment')).toBeInTheDocument();
  });

  it('shows "Next →" text on non-last steps', () => {
    renderStep(<StepWrapper {...defaultProps} isLastStep={false} />);
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  it('keeps Next reachable and exposes invalid state when isValid=false', () => {
    renderStep(<StepWrapper {...defaultProps} isValid={false} />);
    const nextBtn = screen.getByText('Next →').closest('button');
    expect(nextBtn).not.toBeDisabled();
    expect(nextBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables Next when isSubmitting=true', () => {
    renderStep(<StepWrapper {...defaultProps} isLastStep={true} isSubmitting={true} />);
    const submitBtn = screen.getByText('Analyzing…').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('calls onNext when Next is clicked', async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    renderStep(<StepWrapper {...defaultProps} onNext={onNext} />);
    await user.click(screen.getByText('Next →'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when Back is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    renderStep(<StepWrapper {...defaultProps} onBack={onBack} />);
    await user.click(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('announces progress and delegates cancellation to the adapter', async () => {
    const user = userEvent.setup();
    renderStep(<StepWrapper {...defaultProps} isFirstStep />);
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
