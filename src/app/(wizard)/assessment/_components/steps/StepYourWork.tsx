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
}

export default function StepYourWork({ step }: Props) {
  const { answers, setStepAnswers, nextStep, prevStep } = useWizardStore();
  const schema = buildStepSchema(step.questions);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: Object.fromEntries(
      step.questions.map((q) => [q.id, answers[q.id] ?? undefined])
    ),
  });

  const onNext = form.handleSubmit((values) => {
    setStepAnswers(values);
    nextStep();
  });

  return (
    <StepWrapper
      title={step.title}
      subtitle={step.subtitle}
      onNext={onNext}
      onBack={prevStep}
      isFirstStep={true}
      isLastStep={false}
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
