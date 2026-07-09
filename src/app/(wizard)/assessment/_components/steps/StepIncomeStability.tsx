'use client';

import AssessmentQuestionStep from './AssessmentQuestionStep';
import type { AssessmentStep } from '@/types/risk-assessment';
import type { ApiFieldErrors } from '@/types/api';

interface Props {
  step: AssessmentStep;
  serverFieldErrors?: ApiFieldErrors;
}

export default function StepIncomeStability({ step, serverFieldErrors }: Props) {
  return <AssessmentQuestionStep step={step} serverFieldErrors={serverFieldErrors} />;
}
