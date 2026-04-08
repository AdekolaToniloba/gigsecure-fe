import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepSidebar from '@/app/(wizard)/assessment/_components/StepSidebar';
import type { AssessmentStep } from '@/types/risk-assessment';

const mockSteps: AssessmentStep[] = [
  { step: 1, title: 'You & your work', subtitle: 'Role details', questions: [] },
  { step: 2, title: 'Income & stability', subtitle: 'Earnings', questions: [] },
  { step: 3, title: 'Your risks', subtitle: 'Work hazards', questions: [] },
  { step: 4, title: 'Health & lifestyle', subtitle: 'Wellbeing', questions: [] },
  { step: 5, title: 'Safety net', subtitle: 'Coverage', questions: [] },
];

describe('StepSidebar', () => {
  it('renders all step titles', () => {
    render(<StepSidebar steps={mockSteps} currentStep={0} />);
    expect(screen.getByText('You & your work')).toBeInTheDocument();
    expect(screen.getByText('Income & stability')).toBeInTheDocument();
    expect(screen.getByText('Your risks')).toBeInTheDocument();
    expect(screen.getByText('Health & lifestyle')).toBeInTheDocument();
    expect(screen.getByText('Safety net')).toBeInTheDocument();
  });

  it('renders "Risk Assessment" label', () => {
    render(<StepSidebar steps={mockSteps} currentStep={0} />);
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
  });

  it('renders step numbers for non-completed steps', () => {
    render(<StepSidebar steps={mockSteps} currentStep={2} />);
    // Step 3 (index 2) is active, steps 4-5 (indices 3-4) should show their numbers
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders security note', () => {
    render(<StepSidebar steps={mockSteps} currentStep={0} />);
    expect(screen.getByText('Your data is secure and private.')).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<StepSidebar steps={mockSteps} currentStep={0} />);
    expect(screen.getByText('What is a risk assessment')).toBeInTheDocument();
    expect(screen.getByText(/Contact Support/)).toBeInTheDocument();
  });
});
