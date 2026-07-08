'use client';

import AssessmentQuestionStep from './AssessmentQuestionStep';
import type { AssessmentStep } from '@/types/risk-assessment';

interface Props {
  step: AssessmentStep;
}

export default function StepHealthLifestyle({ step }: Props) {
  return <AssessmentQuestionStep step={step} />;
}
