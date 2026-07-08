import { useId } from 'react';
import { formatNullableDisplay } from '@/lib/dashboard/formatters';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ReactNode;
  supportingText?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function MetricCard({
  label,
  value,
  icon,
  supportingText,
  action,
  className,
}: MetricCardProps) {
  const labelId = useId();
  const displayValue = formatNullableDisplay(value);

  return (
    <article
      aria-labelledby={labelId}
      className={cn(
        'flex min-h-40 min-w-0 flex-col overflow-hidden rounded-xl border border-app-border bg-white p-4 shadow-sm',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-white"
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 id={labelId} className="text-sm font-semibold leading-5 text-primary-light">
            {label}
          </h3>
          <p className="mt-2 break-words font-heading text-2xl font-bold leading-tight text-primary [overflow-wrap:anywhere]">
            {displayValue}
          </p>
        </div>
      </div>

      {supportingText ? (
        <div className="mt-3 min-w-0 break-words text-sm leading-5 text-slate-500 [overflow-wrap:anywhere]">
          {supportingText}
        </div>
      ) : null}

      {action ? (
        <div className="mt-auto min-w-0 border-t border-app-border pt-4 text-sm font-semibold text-primary">
          {action}
        </div>
      ) : null}
    </article>
  );
}

export function MetricCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}
