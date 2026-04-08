'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';
import { useRiskQuestions, useSubmitTechAssessment } from '@/hooks/risk/useRisk';
import StepSidebar from './StepSidebar';
import ConsentGate from './ConsentGate';
import ReportScreen from './ReportScreen';
import StepYourWork from './steps/StepYourWork';
import StepIncomeStability from './steps/StepIncomeStability';
import StepYourRisks from './steps/StepYourRisks';
import StepHealthLifestyle from './steps/StepHealthLifestyle';
import StepSafetyNet from './steps/StepSafetyNet';
import {
  StepSkeleton,
  SidebarSkeleton,
  ReportSkeleton,
} from './skeletons/Skeletons';
import type { TechAssessmentInput } from '@/types/api';

export default function RiskWizard() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { currentStep, answers, healthConsent, reset } = useWizardStore();
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    data: questionsData,
    isLoading,
    isError,
    refetch,
  } = useRiskQuestions();

  const submitMutation = useSubmitTechAssessment();

  // Auth guard
  useEffect(() => {
    if (!token) {
      router.push('/waitlist');
    }
  }, [token, router]);

  // Resume banner
  useEffect(() => {
    if (currentStep > 0) {
      setShowResumeBanner(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus management on step change
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-step-title]');
    el?.focus();
  }, [currentStep]);

  // Build the typed payload from the flat answers map
  const buildPayload = (flatAnswers: Record<string, unknown>): TechAssessmentInput => {
    const toBool = (v: unknown) => v === 'true' || v === true;
    const toInt = (v: unknown) => parseInt(String(v), 10);

    return {
      job_type: String(flatAnswers.job_type ?? ''),
      freelance_duration: String(flatAnswers.freelance_duration ?? ''),
      client_geography: String(flatAnswers.client_geography ?? ''),
      work_mode: String(flatAnswers.work_mode ?? ''),
      weekly_hours: String(flatAnswers.weekly_hours ?? ''),
      monthly_income_band: String(flatAnswers.monthly_income_band ?? ''),
      income_stability: String(flatAnswers.income_stability ?? ''),
      income_sources: String(flatAnswers.income_sources ?? ''),
      biggest_client_loss: String(flatAnswers.biggest_client_loss ?? ''),
      past_risks: (flatAnswers.past_risks as string[]) ?? [],
      top_worries: (flatAnswers.top_worries as string[]) ?? [],
      equipment_dependency: String(flatAnswers.equipment_dependency ?? ''),
      pre_existing_conditions: toBool(flatAnswers.pre_existing_conditions),
      chronic_illness: toBool(flatAnswers.chronic_illness),
      smoker: toBool(flatAnswers.smoker),
      health_rating: toInt(flatAnswers.health_rating) || 3,
      travel_frequency: String(flatAnswers.travel_frequency ?? ''),
      survival_3_months: String(flatAnswers.survival_3_months ?? ''),
      savings_duration: String(flatAnswers.savings_duration ?? ''),
      insurance_types: (flatAnswers.insurance_types as string[]) ?? [],
      insurance_claims: String(flatAnswers.insurance_claims ?? ''),
      protection_priority: String(flatAnswers.protection_priority ?? ''),
    };
  };

  const handleFinalSubmit = async (finalAnswers: Record<string, unknown>) => {
    setSubmitError('');
    try {
      const payload = buildPayload(finalAnswers);
      await submitMutation.mutateAsync(payload);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        'Submission failed. Please try again.';
      setSubmitError(message);
    }
  };

  // Not authenticated
  if (!token) return null;

  // Report screen (post-submit)
  if (submitMutation.isSuccess && submitMutation.data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <ReportScreen data={submitMutation.data} />
      </div>
    );
  }

  // Submitting in progress
  if (submitMutation.isPending) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <ReportSkeleton />
        </div>
      </div>
    );
  }

  // Loading questions
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
        <div className="max-w-5xl mx-auto flex gap-8">
          <SidebarSkeleton />
          <div className="flex-1">
            <StepSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Error loading questions
  if (isError || !questionsData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="font-heading text-[20px] font-bold text-[#0F172A] mb-2">
            Couldn&apos;t load questions
          </h2>
          <p className="font-body text-[14px] text-gray-500 mb-6">
            There was a problem fetching the assessment questions.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-11 px-8 rounded-lg bg-[#004E4C] text-white font-body text-[14px] font-semibold cursor-pointer hover:bg-[#004E4C]/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const steps = questionsData.steps ?? [];
  const activeStep = steps[currentStep];
  const isHealthStep = currentStep === 3;
  const showConsentGate = isHealthStep && !healthConsent;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white flex items-start justify-center pt-8">
      {/* ─── Resume Banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {showResumeBanner && (
          <motion.div
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            className="bg-[#004E4C]/10 border-b border-[#004E4C]/20 px-6 py-3 flex items-center justify-between w-full fixed top-16 z-50"
            aria-live="polite"
          >
            <p className="font-body text-[13px] text-[#004E4C]">
              You were on step {currentStep + 1}.{' '}
              <span className="font-semibold">Continue where you left off?</span>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResumeBanner(false)}
                className="text-[13px] font-semibold text-[#004E4C] font-body hover:underline cursor-pointer"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => { reset(); setShowResumeBanner(false); }}
                className="text-[13px] text-gray-500 font-body hover:underline cursor-pointer"
              >
                Start over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-6 lg:gap-12">
        {/* Sidebar */}
        <StepSidebar steps={steps} currentStep={currentStep} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Submit error */}
          {submitError && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 font-body text-sm text-red-700">
              {submitError}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {showConsentGate ? (
                <ConsentGate step={activeStep} />
              ) : activeStep ? (
                currentStep === 0 ? <StepYourWork step={activeStep} /> :
                currentStep === 1 ? <StepIncomeStability step={activeStep} /> :
                currentStep === 2 ? <StepYourRisks step={activeStep} /> :
                currentStep === 3 ? <StepHealthLifestyle step={activeStep} /> :
                currentStep === 4 ? (
                  <StepSafetyNet
                    step={activeStep}
                    isSubmitting={submitMutation.isPending}
                    onSubmit={handleFinalSubmit}
                  />
                ) : null
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
