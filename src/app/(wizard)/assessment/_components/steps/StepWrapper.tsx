'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';

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
  const router = useRouter();
  const reset = useWizardStore((s) => s.reset);

  const handleCancel = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Step content */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
        <div
          tabIndex={-1}
          data-step-title
          className="outline-none mb-5"
          suppressHydrationWarning
        >
          <h2 className="font-heading text-[28px] font-bold text-[#0F172A] leading-tight">
            {title}
          </h2>
          <p className="text-[#64748B] font-body text-[14px] mt-1.5">{subtitle}</p>
        </div>

        <div>{children}</div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 sticky bottom-0 bg-white">
        {isFirstStep ? (
          <button
            type="button"
            onClick={handleCancel}
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
          disabled={!isValid || isSubmitting}
          whileHover={isValid && !isSubmitting ? { scale: 1.02 } : {}}
          whileTap={isValid && !isSubmitting ? { scale: 0.98 } : {}}
          className="h-11 px-8 rounded-lg bg-[#FFE419] text-[#004E4C] font-body text-[14px] font-bold hover:bg-[#EBD001] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-[#004E4C]/30 border-t-[#004E4C]"
              />
              <span>Analyzing...</span>
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
