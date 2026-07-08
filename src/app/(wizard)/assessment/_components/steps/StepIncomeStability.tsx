'use client';

import AssessmentQuestionStep from './AssessmentQuestionStep';
import type { AssessmentStep } from '@/types/risk-assessment';

interface Props {
  step: AssessmentStep;
}

export default function StepIncomeStability({ step }: Props) {
  return <AssessmentQuestionStep step={step} />;
}
