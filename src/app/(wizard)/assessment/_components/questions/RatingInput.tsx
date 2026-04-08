'use client';

import { motion } from 'framer-motion';
import { Controller, type Control } from 'react-hook-form';
import type { RatingQuestion } from '@/types/risk-assessment';

interface Props {
  question: RatingQuestion;
  control: Control<Record<string, unknown>>;
  error?: string;
}

export default function RatingInput({ question, control, error }: Props) {
  const values = Array.from(
    { length: question.max - question.min + 1 },
    (_, i) => question.min + i
  );

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
            className="flex gap-2"
          >
            {values.map((val) => {
              const isSelected = field.value === val;
              const label = question.labels[String(val)];
              return (
                <motion.button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${val}${label ? ` – ${label}` : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => field.onChange(val)}
                  className={`flex flex-col items-center justify-center flex-1 rounded-lg border py-3 px-1 transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] ${
                    isSelected
                      ? 'border-[#004E4C] bg-[#004E4C] text-white'
                      : 'border-gray-200 bg-white text-[#334155] hover:border-gray-300'
                  }`}
                >
                  <span className="font-body text-[15px] font-bold">{val}</span>
                  {label && (
                    <span className={`font-body text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  )}
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
