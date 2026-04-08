'use client';

import { motion } from 'framer-motion';
import { Controller, type Control } from 'react-hook-form';
import type { BooleanQuestion } from '@/types/risk-assessment';

interface Props {
  question: BooleanQuestion;
  control: Control<Record<string, unknown>>;
  error?: string;
}

export default function BooleanInput({ question, control, error }: Props) {
  return (
    <div>
      <Controller
        name={question.id}
        control={control}
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label={question.text}
            aria-describedby={error ? `${question.id}-error` : undefined}
            className="grid grid-cols-2 gap-3"
          >
            {(['true', 'false'] as const).map((val) => {
              const label = val === 'true' ? 'Yes' : 'No';
              const isSelected = field.value === val;
              return (
                <motion.button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => field.onChange(val)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] ${
                    isSelected
                      ? 'border-[#004E4C] bg-[#004E4C]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
                      isSelected ? 'border-[#004E4C] bg-[#004E4C]' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <span className="font-body text-[14px] text-[#334155] font-medium">{label}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      />
      {error && (
        <p id={`${question.id}-error`} role="alert" className="mt-2 text-xs text-red-500 font-body">
          {error}
        </p>
      )}
    </div>
  );
}
