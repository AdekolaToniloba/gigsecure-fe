'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizardStore } from '@/store/wizard-store';
import { buildStepSchema } from '../../_lib/buildStepSchema';
import QuestionRenderer from '../questions/QuestionRenderer';
import StepWrapper from './StepWrapper';
import type { AssessmentStep } from '@/types/risk-assessment';

interface Props {
  step: AssessmentStep;
  isSubmitting: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}

export default function StepSafetyNet({ step, isSubmitting, onSubmit }: Props) {
  const { answers, setStepAnswers, prevStep } = useWizardStore();
  const schema = buildStepSchema(step.questions);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: Object.fromEntries(
      step.questions.map((q) => [q.id, answers[q.id] ?? undefined])
    ),
  });

  const handleSubmit = form.handleSubmit((values) => {
    setStepAnswers(values);
    onSubmit({ ...answers, ...values });
  });

  return (
    <StepWrapper
      title={step.title}
      subtitle={step.subtitle}
      onNext={handleSubmit}
      onBack={prevStep}
      isFirstStep={false}
      isLastStep={true}
      isSubmitting={isSubmitting}
      isValid={form.formState.isValid}
    >
      {step.questions.map((q) => (
        <QuestionRenderer
          key={q.id}
          question={q}
          control={form.control as unknown as Parameters<typeof QuestionRenderer>[0]['control']}
          errors={form.formState.errors}
        />
      ))}
    </StepWrapper>
  );
}
