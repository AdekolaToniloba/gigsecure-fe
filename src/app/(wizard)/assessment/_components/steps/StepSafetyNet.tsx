'use client';

import AssessmentQuestionStep from './AssessmentQuestionStep';
import type { AssessmentStep } from '@/types/risk-assessment';

interface Props {
  step: AssessmentStep;
  isSubmitting: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}

export default function StepSafetyNet({ step, isSubmitting, onSubmit }: Props) {
  return (
    <AssessmentQuestionStep
      step={step}
      isLastStep
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
