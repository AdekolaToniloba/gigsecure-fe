'use client';

import { AlertTriangle } from 'lucide-react';
import { useId } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { AssessmentResponse } from '@/types/api';

type RiskLevelCardProps = Pick<AssessmentResponse, 'risk_profile' | 'overall_score'> & {
  className?: string;
};

type RiskLevelCardErrorProps = {
  onRetry: () => void;
  message?: string;
  className?: string;
};

function formatScore(score: number): string {
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 1 }).format(score);
}

export function RiskLevelCard({
  risk_profile: riskProfile,
  overall_score: overallScore,
  className,
}: RiskLevelCardProps) {
  const titleId = useId();
  const visualScore = Math.min(100, Math.max(0, overallScore));
  const scoreLabel = formatScore(overallScore);
  const summary = `${riskProfile}, score ${scoreLabel} out of 100`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'flex min-h-64 min-w-0 flex-col items-center overflow-hidden rounded-xl border border-app-border bg-white p-6 text-center shadow-sm sm:p-7 lg:min-h-72',
        className
      )}
    >
      <h2 id={titleId} className="font-heading text-xl font-bold leading-tight text-primary">
        Financial Risk Level
      </h2>
      <p className="mt-2 text-sm leading-6 text-primary-light">
        Based on your latest completed assessment.
      </p>

      <div
        role="img"
        aria-label={summary}
        data-visual-score={visualScore}
        className="mt-5 flex h-40 w-40 shrink-0 items-center justify-center rounded-full p-4"
        style={{
          background: `conic-gradient(var(--color-accent) 0 ${visualScore}%, var(--color-app-sidebar) ${visualScore}% 100%)`,
        }}
      >
        <div className="flex h-full w-full min-w-0 flex-col items-center justify-center rounded-full bg-white px-3 shadow-inner">
          <span className="font-heading text-3xl font-bold leading-none text-primary">
            {scoreLabel}
          </span>
          <span className="mt-1 text-xs font-medium text-primary-light">out of 100</span>
        </div>
      </div>
      <p className="mt-4 max-w-full break-words font-heading text-lg font-bold leading-tight text-primary [overflow-wrap:anywhere]">
        {riskProfile}
      </p>
    </article>
  );
}

export function RiskLevelCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      role="status"
      aria-live="polite"
      aria-label="Loading financial risk level"
      className={cn(
        'flex min-h-64 min-w-0 flex-col items-center overflow-hidden rounded-xl border border-app-border bg-white p-6 text-center shadow-sm sm:p-7 lg:min-h-72',
        className
      )}
    >
      <span className="sr-only">Loading financial risk level…</span>
      <div aria-hidden="true" className="flex w-full flex-col items-center motion-reduce:[&_*]:animate-none">
        <div className="h-6 w-40 max-w-full animate-pulse rounded bg-primary-muted" />
        <div className="mt-3 h-4 w-52 max-w-full animate-pulse rounded bg-primary-muted" />
        <div className="mt-6 h-40 w-40 animate-pulse rounded-full bg-primary-muted" />
      </div>
    </article>
  );
}

export function RiskLevelCardError({
  onRetry,
  message = 'We could not load your latest risk assessment right now.',
  className,
}: RiskLevelCardErrorProps) {
  const titleId = useId();

  return (
    <article
      role="alert"
      aria-live="assertive"
      aria-labelledby={titleId}
      className={cn(
        'flex min-h-64 min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-7 lg:min-h-72',
        className
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
        <AlertTriangle aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 id={titleId} className="mt-4 font-heading text-xl font-bold text-primary">
        Financial Risk Level
      </h2>
      <p className="mt-2 max-w-sm break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
        {message}
      </p>
      <Button type="button" onClick={onRetry} className="mt-5 min-h-11">
        Try again
      </Button>
    </article>
  );
}
