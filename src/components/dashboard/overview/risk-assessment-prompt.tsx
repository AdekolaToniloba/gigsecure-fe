import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type RiskAssessmentPromptProps = {
  description?: string;
  className?: string;
};

const DEFAULT_DESCRIPTION =
  'Take a quick assessment to understand your risk level and get protection recommendations tailored to your work.';

export function RiskAssessmentPrompt({
  description = DEFAULT_DESCRIPTION,
  className,
}: RiskAssessmentPromptProps) {
  const titleId = useId();
  const unavailableDescriptionId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'flex min-h-64 min-w-0 flex-col items-center overflow-hidden rounded-xl border border-app-border bg-white p-6 text-center shadow-sm sm:p-7 lg:min-h-[19.5rem]',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary"
      >
        <ShieldCheck className="h-7 w-7" strokeWidth={1.8} />
      </span>

      <h2 id={titleId} className="mt-5 font-heading text-xl font-bold leading-tight text-primary">
        Start with your risk assessment
      </h2>
      <p className="mt-3 max-w-sm min-w-0 break-words text-sm leading-6 text-primary-light [overflow-wrap:anywhere]">
        {description}
      </p>

      <div className="mt-auto flex w-full min-w-0 flex-col items-stretch gap-3 pt-6">
        <Link
          href="/dashboard/risk-assessment"
          className="inline-flex min-h-11 min-w-0 touch-manipulation items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Generate Risk Score
        </Link>
        <button
          type="button"
          disabled
          aria-describedby={unavailableDescriptionId}
          className="inline-flex min-h-11 min-w-0 cursor-not-allowed items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-primary/55 underline decoration-primary/30 underline-offset-4"
        >
          See what you will get
        </button>
        <span id={unavailableDescriptionId} className="sr-only">
          This preview is coming soon.
        </span>
      </div>
    </article>
  );
}
