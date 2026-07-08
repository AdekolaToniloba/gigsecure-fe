'use client';

import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

type RiskAssessmentErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

export function RiskAssessmentError({ title, message, onRetry }: RiskAssessmentErrorProps) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="flex min-h-80 min-w-0 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-10"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
        <AlertTriangle aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-heading text-xl font-bold text-primary">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{message}</p>
      <Button type="button" onClick={onRetry} className="mt-5 min-h-11">
        Try again
      </Button>
    </section>
  );
}
