'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useWizardStore } from '@/store/wizard-store';
import type { AssessmentStep } from '@/types/risk-assessment';

interface Props {
  step: AssessmentStep;
}

export default function ConsentGate({ step }: Props) {
  const [checked, setChecked] = useState(false);
  const { prevStep, setHealthConsent } = useWizardStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-lg mx-auto"
    >
      <div className="mb-6">
        <h2 className="font-heading text-[26px] font-bold text-[#0F172A]">{step.title}</h2>
        <p className="text-[#64748B] font-body text-[14px] mt-1.5">{step.subtitle}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        {/* Lock icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#004E4C]/20 bg-[#004E4C]/5 mb-5">
          <Lock className="h-5 w-5 text-[#004E4C]" />
        </div>

        <h3 className="font-heading text-[18px] font-bold text-[#0F172A] mb-2">
          A few health questions coming up
        </h3>

        <p className="font-body text-[14px] text-[#64748B] leading-relaxed mb-6">
          {step.subtitle}
        </p>

        {/* Consent checkbox */}
        <label
          htmlFor="health-consent"
          className="flex items-start gap-3 cursor-pointer mb-8 border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
        >
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              id="health-consent"
              type="checkbox"
              className="sr-only peer"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <div className="h-5 w-5 rounded border-2 border-gray-300 peer-checked:border-[#004E4C] peer-checked:bg-[#004E4C] flex items-center justify-center transition-all duration-150">
              {checked && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6l3 3 4-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="font-body text-[14px] text-[#334155] leading-relaxed">
            {step.consent_text ?? 'I agree to provide basic health information for insurance assessment purposes.'}
          </span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 h-11 rounded-lg bg-gray-100 text-gray-600 font-body text-[14px] font-medium hover:bg-gray-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!checked}
            onClick={() => setHealthConsent(true)}
            className="flex-1 h-11 rounded-lg bg-[#FFE419] text-[#004E4C] font-body text-[14px] font-bold hover:bg-[#EBD001] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C]"
          >
            Continue to health questions
          </button>
        </div>
      </div>
    </motion.div>
  );
}
