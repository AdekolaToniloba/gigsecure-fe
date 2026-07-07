import Link from 'next/link';
import { ChevronRight, Lightbulb, ScanFace, Store } from 'lucide-react';
import { useId } from 'react';
import { getRecommendedActions } from '@/lib/dashboard/actions';
import { cn } from '@/lib/utils';

type RecommendedActionsProps = {
  recommendations: readonly string[];
  kycVerified: boolean;
  className?: string;
};

export function RecommendedActions({
  recommendations,
  kycVerified,
  className,
}: RecommendedActionsProps) {
  const titleId = useId();
  const actions = getRecommendedActions({ recommendations, kycVerified });
  const hasRecommendations = recommendations.some((recommendation) => recommendation.trim());

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'min-w-0 overflow-hidden rounded-xl border border-app-border bg-white p-5 shadow-sm sm:p-7',
        className,
      )}
    >
      <h2 id={titleId} className="font-heading text-xl font-bold text-primary sm:text-2xl">
        Recommended actions
      </h2>
      <p className="mt-1 text-sm leading-6 text-primary-light">
        Practical next steps based on your latest validated account and assessment data.
      </p>

      {!hasRecommendations ? (
        <p role="status" className="mt-4 rounded-lg bg-app-canvas p-3 text-sm leading-5 text-slate-600">
          No personalized assessment recommendations are available yet.
        </p>
      ) : null}

      <ul className="mt-5 grid min-w-0 gap-3">
        {actions.map((action) => {
          const isInformation = action.status === 'information';
          const Icon = action.id === 'kyc-verification'
            ? ScanFace
            : action.id === 'marketplace'
              ? Store
              : Lightbulb;
          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  isInformation
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-primary-muted text-primary',
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-semibold leading-5 text-primary [overflow-wrap:anywhere]">
                  {action.title}
                </span>
                <span className="mt-1 block break-words text-sm leading-5 text-slate-600 [overflow-wrap:anywhere]">
                  {action.description}
                </span>
              </span>
              {action.href ? (
                <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
              ) : null}
            </>
          );

          return (
            <li key={action.id} data-action-id={action.id} className="min-w-0">
              {action.href ? (
                <Link
                  href={action.href}
                  className="flex min-h-11 min-w-0 items-center gap-3 rounded-lg border border-app-border p-3 outline-none transition-colors hover:bg-app-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex min-w-0 items-start gap-3 rounded-lg border border-app-border p-3">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
