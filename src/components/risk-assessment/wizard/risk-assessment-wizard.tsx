'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRiskCategories, useRiskQuestions, useSubmitTechAssessment } from '@/hooks/risk/useRisk';
import { parseApiError } from '@/lib/api/errors';
import { buildAssessmentPayload } from '@/lib/risk/build-assessment-payload';
import { useWizardStore } from '@/store/wizard-store';
import ConsentGate from '@/app/(wizard)/assessment/_components/ConsentGate';
import StepSidebar from '@/app/(wizard)/assessment/_components/StepSidebar';
import StepPersonalDetails from '@/app/(wizard)/assessment/_components/steps/StepPersonalDetails';
import StepYourWork from '@/app/(wizard)/assessment/_components/steps/StepYourWork';
import StepIncomeStability from '@/app/(wizard)/assessment/_components/steps/StepIncomeStability';
import StepYourRisks from '@/app/(wizard)/assessment/_components/steps/StepYourRisks';
import StepHealthLifestyle from '@/app/(wizard)/assessment/_components/steps/StepHealthLifestyle';
import StepSafetyNet from '@/app/(wizard)/assessment/_components/steps/StepSafetyNet';
import { ReportSkeleton, SidebarSkeleton, StepSkeleton } from '@/app/(wizard)/assessment/_components/skeletons/Skeletons';
import { WizardNavigationProvider } from './risk-assessment-wizard-context';
import type { AssessmentStep } from '@/types/risk-assessment';
import type { ApiFieldErrors } from '@/types/api';
import type { RiskAssessmentWizardProps } from './risk-assessment-wizard.types';

const FALLBACK_STEPS: AssessmentStep[] = [
  { step: 1, title: 'Personal Details', subtitle: 'Basic information', questions: [] },
  { step: 2, title: 'You & your work', subtitle: 'Employment info', questions: [] },
  { step: 3, title: 'Income & stability', subtitle: 'Employment info', questions: [] },
  { step: 4, title: 'Your risks', subtitle: 'Risk factors', questions: [] },
  { step: 5, title: 'Health & lifestyle', subtitle: 'Previous coverage', questions: [] },
  { step: 6, title: 'Safety net & history', subtitle: 'Medical background', questions: [] },
];

const PERSONAL_DETAIL_FIELDS = new Set([
  'first_name', 'last_name', 'date_of_birth', 'gender', 'state', 'city',
  'occupation', 'marital_status',
]);

function classes(fallback: string, override?: string) {
  return override ?? fallback;
}

export function RiskAssessmentWizard(props: RiskAssessmentWizardProps) {
  return <RiskAssessmentWizardSession key={props.mode} {...props} />;
}

function RiskAssessmentWizardSession({
  mode,
  initialDefaults,
  onCancel,
  onSuccess,
  onAuthenticationFailure,
  renderSuccess,
  shell,
}: RiskAssessmentWizardProps) {
  const activeMode = useWizardStore((state) => state.mode);
  const currentStep = useWizardStore((state) => state.currentStep);
  const selectedCategory = useWizardStore((state) => state.selectedCategory);
  const healthConsent = useWizardStore((state) => state.healthConsent);
  const setMode = useWizardStore((state) => state.setMode);
  const setCurrentStep = useWizardStore((state) => state.setCurrentStep);
  const reset = useWizardStore((state) => state.reset);
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reportedAuthenticationError = useRef<unknown>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(
    () => useWizardStore.getState().progressByMode[mode].currentStep > 0,
  );
  const [submitError, setSubmitError] = useState('');
  const [serverFieldErrors, setServerFieldErrors] = useState<ApiFieldErrors>({});
  const [serverErrorField, setServerErrorField] = useState<string | null>(null);
  const isActive = activeMode === mode;
  const categoriesQuery = useRiskCategories({ enabled: isActive });
  const questionsQuery = useRiskQuestions(selectedCategory, { enabled: isActive });
  const submitMutation = useSubmitTechAssessment();

  useLayoutEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!isActive) return;
    rootRef.current?.querySelector<HTMLElement>('[data-step-title]')?.focus();
  }, [currentStep, isActive]);

  useEffect(() => {
    if (!serverErrorField || !isActive) return;
    const field = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[name]') ?? [])
      .find((element) => element.getAttribute('name') === serverErrorField);
    const question = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[data-question-id]') ?? [],
    ).find((element) => element.dataset.questionId === serverErrorField);
    (field ?? question)?.focus();
  }, [currentStep, isActive, serverErrorField]);

  const activeQueryError = currentStep === 0
    ? categoriesQuery.parsedError
    : questionsQuery.parsedError;

  useEffect(() => {
    if (activeQueryError?.statusCode !== 401 || reportedAuthenticationError.current === activeQueryError) {
      return;
    }
    reportedAuthenticationError.current = activeQueryError;
    onAuthenticationFailure(activeQueryError);
  }, [activeQueryError, onAuthenticationFailure]);

  if (!isActive) return null;

  const submit = async (answers: Record<string, unknown>) => {
    setSubmitError('');
    setServerFieldErrors({});
    setServerErrorField(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const category = selectedCategory ?? '';
      const result = await submitMutation.mutateAsync({
        category,
        payload: buildAssessmentPayload(answers, category),
        signal: controller.signal,
      });
      onSuccess(result);
    } catch (error) {
      if (controller.signal.aborted) return;
      const parsedError = parseApiError(error);
      if (parsedError.statusCode === 401) {
        onAuthenticationFailure(parsedError);
        return;
      }
      setSubmitError(parsedError.message);
      const firstField = Object.keys(parsedError.fieldErrors)[0];
      if (parsedError.statusCode === 422 && firstField) {
        setServerFieldErrors(parsedError.fieldErrors);
        setServerErrorField(firstField);
        if (PERSONAL_DETAIL_FIELDS.has(firstField)) {
          setCurrentStep(0);
        } else {
          const questionStep = questionsQuery.data?.steps.findIndex((step) =>
            step.questions.some((question) => question.id === firstField),
          );
          if (questionStep !== undefined && questionStep >= 0) setCurrentStep(questionStep + 1);
        }
      }
    }
  };

  if (submitMutation.isSuccess && submitMutation.data) {
    return <>{renderSuccess?.(submitMutation.data) ?? <p role="status">Assessment complete.</p>}</>;
  }

  if (submitMutation.isPending) {
    return (
      <div className={classes('min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10', shell?.loadingClassName)} aria-busy="true">
        <p className="sr-only" role="status">Analyzing assessment…</p>
        <div className="max-w-3xl mx-auto"><ReportSkeleton /></div>
      </div>
    );
  }

  const isLoading = currentStep === 0 ? categoriesQuery.isLoading : questionsQuery.isLoading;
  if (isLoading && (currentStep === 0 || selectedCategory)) {
    return (
      <div className={classes('min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10', shell?.loadingClassName)} aria-busy="true">
        <div className="mx-auto flex max-w-5xl min-w-0 flex-col gap-6 lg:flex-row lg:gap-8">
          <SidebarSkeleton />
          <div className="min-w-0 flex-1"><StepSkeleton /></div>
        </div>
      </div>
    );
  }

  const hasQueryError = currentStep === 0
    ? categoriesQuery.isError || !categoriesQuery.data
    : questionsQuery.isError || (Boolean(selectedCategory) && !questionsQuery.data);
  if (hasQueryError) {
    const retry = currentStep === 0 ? categoriesQuery.refetch : questionsQuery.refetch;
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6" role="alert">
        <div className="text-center max-w-sm">
          <h2 className="font-heading text-xl font-bold text-[#0F172A] mb-2">Couldn&apos;t load assessment</h2>
          <p className="font-body text-sm text-gray-500 mb-6">There was a problem loading the assessment. Please try again.</p>
          <button type="button" onClick={() => retry()} className="h-11 px-8 rounded-lg bg-[#004E4C] text-white font-body text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[#FFE419]">Try again</button>
        </div>
      </div>
    );
  }

  const fullSteps: AssessmentStep[] = questionsQuery.data?.steps
    ? [FALLBACK_STEPS[0], ...questionsQuery.data.steps]
    : FALLBACK_STEPS;
  const activeStep = fullSteps[currentStep];
  const focusQuestion = (questionId: string) => {
    const questionElement = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[data-question-id]') ?? [],
    ).find((element) => element.dataset.questionId === questionId);
    questionElement?.focus();
  };

  return (
    <WizardNavigationProvider value={{ onCancel, stepNumber: currentStep + 1, totalSteps: fullSteps.length, focusQuestion }}>
      <div ref={rootRef} className={classes('min-h-[calc(100vh-4rem)] bg-white flex items-start justify-center pt-8', shell?.rootClassName)}>
        <AnimatePresence>
          {showResumeBanner && (
            <motion.div
              initial={reduceMotion ? false : { y: -56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: -56, opacity: 0 }}
              className={classes('fixed top-16 z-50 flex w-full flex-col items-start gap-3 border-b border-[#004E4C]/20 bg-[#004E4C]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6', shell?.resumeBannerClassName)}
              aria-live="polite"
            >
              <p className="min-w-0 font-body text-[13px] leading-5 text-[#004E4C]">You were on step {currentStep + 1}. <span className="font-semibold">Continue where you left off?</span></p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => setShowResumeBanner(false)} className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] font-semibold text-[#004E4C] hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C]">Continue</button>
                <button type="button" onClick={() => { reset(mode); setShowResumeBanner(false); }} className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] text-slate-600 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C]">Start over</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={classes('w-full max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-6 lg:gap-12', shell?.contentClassName)}>
          <StepSidebar steps={fullSteps} currentStep={currentStep} />
          <div className="flex-1 min-w-0">
            {submitError && <div role="alert" className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-sm text-red-700">{submitError}</div>}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
              >
                {currentStep === 4 && !healthConsent ? <ConsentGate step={activeStep} /> :
                  currentStep === 0 ? <StepPersonalDetails initialDefaults={initialDefaults} categories={categoriesQuery.data} isCategoriesLoading={categoriesQuery.isLoading} serverFieldErrors={serverFieldErrors} /> :
                  currentStep === 1 ? <StepYourWork step={activeStep} serverFieldErrors={serverFieldErrors} /> :
                  currentStep === 2 ? <StepIncomeStability step={activeStep} serverFieldErrors={serverFieldErrors} /> :
                  currentStep === 3 ? <StepYourRisks step={activeStep} serverFieldErrors={serverFieldErrors} /> :
                  currentStep === 4 ? <StepHealthLifestyle step={activeStep} serverFieldErrors={serverFieldErrors} /> :
                  currentStep === 5 ? <StepSafetyNet step={activeStep} isSubmitting={submitMutation.isPending} onSubmit={submit} serverFieldErrors={serverFieldErrors} /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </WizardNavigationProvider>
  );
}
