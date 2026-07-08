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
import type { RiskAssessmentWizardProps } from './risk-assessment-wizard.types';

const FALLBACK_STEPS: AssessmentStep[] = [
  { step: 1, title: 'Personal Details', subtitle: 'Basic information', questions: [] },
  { step: 2, title: 'You & your work', subtitle: 'Employment info', questions: [] },
  { step: 3, title: 'Income & stability', subtitle: 'Employment info', questions: [] },
  { step: 4, title: 'Your risks', subtitle: 'Risk factors', questions: [] },
  { step: 5, title: 'Health & lifestyle', subtitle: 'Previous coverage', questions: [] },
  { step: 6, title: 'Safety net & history', subtitle: 'Medical background', questions: [] },
];

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
  const reset = useWizardStore((state) => state.reset);
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reportedAuthenticationError = useRef<unknown>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(
    () => useWizardStore.getState().progressByMode[mode].currentStep > 0,
  );
  const [submitError, setSubmitError] = useState('');
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
    }
  };

  if (submitMutation.isSuccess && submitMutation.data) {
    return <>{renderSuccess?.(submitMutation.data) ?? <p role="status">Assessment complete.</p>}</>;
  }

  if (submitMutation.isPending) {
    return (
      <div className={classes('min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10', shell?.loadingClassName)} aria-busy="true">
        <div className="max-w-3xl mx-auto"><ReportSkeleton /></div>
      </div>
    );
  }

  const isLoading = currentStep === 0 ? categoriesQuery.isLoading : questionsQuery.isLoading;
  if (isLoading && (currentStep === 0 || selectedCategory)) {
    return (
      <div className={classes('min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10', shell?.loadingClassName)} aria-busy="true">
        <div className="max-w-5xl mx-auto flex gap-8"><SidebarSkeleton /><div className="flex-1"><StepSkeleton /></div></div>
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
              className={classes('bg-[#004E4C]/10 border-b border-[#004E4C]/20 px-6 py-3 flex items-center justify-between w-full fixed top-16 z-50', shell?.resumeBannerClassName)}
              aria-live="polite"
            >
              <p className="font-body text-[13px] text-[#004E4C]">You were on step {currentStep + 1}. <span className="font-semibold">Continue where you left off?</span></p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowResumeBanner(false)} className="text-[13px] font-semibold text-[#004E4C] hover:underline">Continue</button>
                <button type="button" onClick={() => { reset(mode); setShowResumeBanner(false); }} className="text-[13px] text-gray-500 hover:underline">Start over</button>
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
                  currentStep === 0 ? <StepPersonalDetails initialDefaults={initialDefaults} categories={categoriesQuery.data} isCategoriesLoading={categoriesQuery.isLoading} /> :
                  currentStep === 1 ? <StepYourWork step={activeStep} /> :
                  currentStep === 2 ? <StepIncomeStability step={activeStep} /> :
                  currentStep === 3 ? <StepYourRisks step={activeStep} /> :
                  currentStep === 4 ? <StepHealthLifestyle step={activeStep} /> :
                  currentStep === 5 ? <StepSafetyNet step={activeStep} isSubmitting={submitMutation.isPending} onSubmit={submit} /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </WizardNavigationProvider>
  );
}
