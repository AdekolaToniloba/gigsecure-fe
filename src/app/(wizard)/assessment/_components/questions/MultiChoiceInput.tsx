'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';
import type { MultiChoiceQuestion } from '@/types/risk-assessment';

interface Props {
  question: MultiChoiceQuestion;
  control: Control<Record<string, unknown>>;
  error?: string;
}

export default function MultiChoiceInput({ question, control, error }: Props) {
  return (
    <div>
      <Controller
        name={question.id}
        control={control}
        defaultValue={[]}
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];

          const toggle = (option: string) => {
            const next = selected.includes(option)
              ? selected.filter((v) => v !== option)
              : [...selected, option];
            field.onChange(next);
          };

          return (
            <div
              role="group"
              aria-label={question.text}
              aria-describedby={error ? `${question.id}-error` : undefined}
              className="flex flex-col gap-2.5"
            >
              {question.options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <motion.button
                    key={option}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggle(option)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#004E4C] ${
                      isSelected
                        ? 'border-[#004E4C] bg-[#004E4C]/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all duration-150 ${
                        isSelected
                          ? 'border-[#004E4C] bg-[#004E4C]'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="font-body text-[14px] text-[#334155]">{option}</span>
                  </motion.button>
                );
              })}
            </div>
          );
        }}
      />
      {error && (
        <p id={`${question.id}-error`} role="alert" className="mt-2 text-xs text-red-500 font-body">
          {error}
        </p>
      )}
    </div>
  );
}
