'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useWizardNavigation } from '@/components/risk-assessment/wizard/risk-assessment-wizard-context';

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  isValid?: boolean;
}

export default function StepWrapper({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  isFirstStep,
  isLastStep,
  isSubmitting,
  isValid = true,
}: Props) {
  const { onCancel, stepNumber, totalSteps } = useWizardNavigation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col min-h-full">
      {/* Step content */}
      <div className="min-w-0 flex-1">
        <div
          tabIndex={-1}
          data-step-title
          className="mb-5 scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C]"
          suppressHydrationWarning
        >
          <p className="sr-only" aria-live="polite">
            Step {stepNumber} of {totalSteps}
          </p>
          <h2 className="text-pretty font-heading text-[28px] font-bold leading-tight text-[#0F172A]">
            {title}
          </h2>
          <p className="text-[#64748B] font-body text-[14px] mt-1.5">{subtitle}</p>
        </div>

        <div>{children}</div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-3 border-t border-gray-100 bg-white pb-[max(0rem,env(safe-area-inset-bottom))] pt-6">
        {isFirstStep ? (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-6 rounded-lg bg-gray-100 text-gray-600 font-body text-[14px] font-medium hover:bg-gray-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C]"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="h-11 px-6 rounded-lg bg-gray-100 text-gray-600 font-body text-[14px] font-medium hover:bg-gray-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
        )}

        <motion.button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          aria-disabled={!isValid || undefined}
          whileHover={!reduceMotion && isValid && !isSubmitting ? { scale: 1.02 } : {}}
          whileTap={!reduceMotion && isValid && !isSubmitting ? { scale: 0.98 } : {}}
          className="h-11 px-8 rounded-lg bg-[#FFE419] text-[#004E4C] font-body text-[14px] font-bold hover:bg-[#EBD001] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-[#004E4C]/30 border-t-[#004E4C]"
              />
              <span>Analyzing…</span>
            </>
          ) : isLastStep ? (
            'Submit Assessment'
          ) : (
            'Next →'
          )}
        </motion.button>
      </div>
    </div>
  );
}
