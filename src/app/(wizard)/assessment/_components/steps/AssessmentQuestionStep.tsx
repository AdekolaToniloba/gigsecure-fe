'use client';

import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizardStore } from '@/store/wizard-store';
import { buildStepSchema } from '../../_lib/buildStepSchema';
import QuestionRenderer from '../questions/QuestionRenderer';
import StepWrapper from './StepWrapper';
import type { AssessmentStep } from '@/types/risk-assessment';
import { useWizardNavigation } from '@/components/risk-assessment/wizard/risk-assessment-wizard-context';

type AssessmentQuestionStepProps = {
  step: AssessmentStep;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  onSubmit?: (values: Record<string, unknown>) => void;
};

export default function AssessmentQuestionStep({
  step,
  isLastStep = false,
  isSubmitting = false,
  onSubmit,
}: AssessmentQuestionStepProps) {
  const answers = useWizardStore((state) => state.answers);
  const setStepAnswers = useWizardStore((state) => state.setStepAnswers);
  const nextStep = useWizardStore((state) => state.nextStep);
  const prevStep = useWizardStore((state) => state.prevStep);
  const schema = buildStepSchema(step.questions);
  const { focusQuestion } = useWizardNavigation();

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    shouldFocusError: true,
    defaultValues: Object.fromEntries(
      step.questions.map((question) => [question.id, answers[question.id] ?? undefined]),
    ),
  });

  const focusFirstInvalidQuestion = (errors: FieldErrors<Record<string, unknown>>) => {
    const firstInvalidQuestion = step.questions.find((question) => errors[question.id]);
    if (!firstInvalidQuestion) return;
    focusQuestion(firstInvalidQuestion.id);
  };

  const handleNext = form.handleSubmit(
    (values) => {
      setStepAnswers(values);
      if (isLastStep) {
        onSubmit?.({ ...answers, ...values });
        return;
      }
      nextStep();
    },
    focusFirstInvalidQuestion,
  );

  return (
    <StepWrapper
      title={step.title}
      subtitle={step.subtitle}
      onNext={handleNext}
      onBack={prevStep}
      isFirstStep={false}
      isLastStep={isLastStep}
      isSubmitting={isSubmitting}
      isValid={form.formState.isValid}
    >
      {step.questions.map((question) => (
        <QuestionRenderer
          key={question.id}
          question={question}
          control={form.control as unknown as Parameters<typeof QuestionRenderer>[0]['control']}
          errors={form.formState.errors}
        />
      ))}
    </StepWrapper>
  );
}
