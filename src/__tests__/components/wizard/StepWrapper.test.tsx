import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepWrapper from '@/app/(wizard)/assessment/_components/steps/StepWrapper';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('StepWrapper', () => {
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
    render(<StepWrapper {...defaultProps} />);
    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<StepWrapper {...defaultProps} />);
    expect(screen.getByText('Step content')).toBeInTheDocument();
  });

  it('shows "Cancel" on the first step (no "Back")', () => {
    render(<StepWrapper {...defaultProps} isFirstStep={true} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
  });

  it('shows "Back" on non-first steps (no "Cancel")', () => {
    render(<StepWrapper {...defaultProps} isFirstStep={false} />);
    expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('shows "Submit Assessment" text on last step', () => {
    render(<StepWrapper {...defaultProps} isLastStep={true} />);
    expect(screen.getByText('Submit Assessment')).toBeInTheDocument();
  });

  it('shows "Next →" text on non-last steps', () => {
    render(<StepWrapper {...defaultProps} isLastStep={false} />);
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  it('disables Next when isValid=false', () => {
    render(<StepWrapper {...defaultProps} isValid={false} />);
    const nextBtn = screen.getByText('Next →').closest('button');
    expect(nextBtn).toBeDisabled();
  });

  it('disables Next when isSubmitting=true', () => {
    render(<StepWrapper {...defaultProps} isLastStep={true} isSubmitting={true} />);
    const submitBtn = screen.getByText('Analyzing...').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('calls onNext when Next is clicked', async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(<StepWrapper {...defaultProps} onNext={onNext} />);
    await user.click(screen.getByText('Next →'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when Back is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<StepWrapper {...defaultProps} onBack={onBack} />);
    await user.click(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
