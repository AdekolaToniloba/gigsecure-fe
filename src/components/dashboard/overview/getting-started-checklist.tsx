import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Circle,
  MailCheck,
  ScanFace,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useId } from 'react';
import { getGettingStartedActions } from '@/lib/dashboard/actions';
import { cn } from '@/lib/utils';

type GettingStartedChecklistProps = {
  riskAssessed: boolean;
  kycVerified: boolean;
  emailVerified: boolean;
  className?: string;
};

const icons = {
  'risk-assessment': ShieldCheck,
  'kyc-verification': ScanFace,
  'email-verification': MailCheck,
  marketplace: Store,
};

export function GettingStartedChecklist({
  riskAssessed,
  kycVerified,
  emailVerified,
  className,
}: GettingStartedChecklistProps) {
  const titleId = useId();
  const actions = getGettingStartedActions({ riskAssessed, kycVerified, emailVerified });

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'min-w-0 overflow-hidden rounded-xl border border-app-border bg-white p-5 shadow-sm sm:p-7',
        className,
      )}
    >
      <h2 id={titleId} className="font-heading text-xl font-bold text-primary sm:text-2xl">
        Lets get started
      </h2>
      <p className="mt-1 text-sm leading-6 text-primary-light">
        Follow these account steps to make the most of GigSecure.
      </p>

      <ul className="mt-5 grid min-w-0 gap-3">
        {actions.map((action) => {
          const Icon = icons[action.id as keyof typeof icons] ?? Circle;
          const isComplete = action.status === 'complete';
          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  isComplete
                    ? 'bg-primary text-white'
                    : 'bg-primary-muted text-primary',
                )}
              >
                {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-semibold leading-5 text-primary [overflow-wrap:anywhere]">
                  {action.title}
                </span>
                <span className="mt-1 block break-words text-sm leading-5 text-slate-600 [overflow-wrap:anywhere]">
                  {action.description}
                </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-primary-light">
                  {action.status === 'complete'
                    ? 'Completed'
                    : action.status === 'available'
                      ? 'Available'
                      : 'To do'}
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
                <div className="flex min-w-0 items-center gap-3 rounded-lg border border-app-border p-3">
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
