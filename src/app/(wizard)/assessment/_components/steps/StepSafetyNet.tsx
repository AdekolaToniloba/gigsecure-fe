'use client';

import AssessmentQuestionStep from './AssessmentQuestionStep';
import type { AssessmentStep } from '@/types/risk-assessment';
import type { ApiFieldErrors } from '@/types/api';

interface Props {
  step: AssessmentStep;
  isSubmitting: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
  serverFieldErrors?: ApiFieldErrors;
}

export default function StepSafetyNet({ step, isSubmitting, onSubmit, serverFieldErrors }: Props) {
  return (
    <AssessmentQuestionStep
      step={step}
      isLastStep
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      serverFieldErrors={serverFieldErrors}
    />
  );
}
