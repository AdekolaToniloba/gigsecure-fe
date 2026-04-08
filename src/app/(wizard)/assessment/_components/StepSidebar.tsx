'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useWizardStore } from '@/store/wizard-store';
import type { AssessmentStep } from '@/types/risk-assessment';

interface Props {
  steps: AssessmentStep[];
  currentStep: number;
}

export default function StepSidebar({ steps, currentStep }: Props) {
  const fullSteps = steps;

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <p className="text-[#004E4C] font-body text-[11px] font-bold uppercase tracking-widest mb-5">
          Risk Assessment
        </p>

        <ul className="flex flex-row overflow-x-auto pb-4 lg:pb-0 lg:flex-col lg:space-y-1 gap-6 lg:gap-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" role="list">
          {fullSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;

            return (
              <li key={step.title} className="flex flex-shrink-0 items-center lg:items-start gap-3 lg:gap-4 lg:py-3 relative snap-start">
                {/* Connecting line for all but last item */}
                {index < fullSteps.length - 1 && (
                  <div className="hidden lg:block absolute left-4 top-10 bottom-[-10px] w-px bg-gray-200" />
                )}
                
                {/* Step circle */}
                <div
                  className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 relative z-10 ${
                    isActive || isCompleted
                      ? 'bg-[#FFE419] text-[#004E4C] border-2 border-[#004E4C]'
                      : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-4 w-4 text-[#004E4C]" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="number"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={`font-body text-[13px] font-bold ${isActive ? 'text-[#004E4C]' : 'text-gray-500'}`}
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Step text */}
                <div className="flex flex-col justify-center lg:flex-1 lg:min-w-0">
                  <p
                    className={`font-body text-[13px] font-semibold leading-tight whitespace-nowrap lg:whitespace-normal ${
                      isActive ? 'text-[#004E4C]' : isCompleted ? 'text-[#334155]' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="hidden lg:block font-body text-[11px] text-gray-400 mt-0.5 truncate">
                    {step.subtitle}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Footer info - hidden on mobile */}
        <div className="hidden lg:block mt-6 pt-5 border-t border-gray-100 space-y-2">
          <a
            href="#"
            className="flex items-center gap-2 text-[12px] text-[#004E4C] font-body font-medium hover:underline"
          >
            What is a risk assessment
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-[12px] text-[#004E4C] font-body font-medium hover:underline"
          >
            FAQ&apos;s on GigSecure
          </a>
        </div>

        <div className="hidden lg:flex mt-5 items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check className="h-2.5 w-2.5 text-green-600" strokeWidth={3} />
          </div>
          <p className="font-body text-[11px] text-gray-400">Your data is secure and private.</p>
        </div>
        <a href="#" className="hidden lg:block mt-1 font-body text-[11px] text-[#004E4C] hover:underline">
          Need help? <span className="font-semibold">Contact Support</span>
        </a>
      </div>
    </aside>
  );
}
