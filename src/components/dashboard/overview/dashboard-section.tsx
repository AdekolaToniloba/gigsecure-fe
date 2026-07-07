import { useId } from 'react';
import { cn } from '@/lib/utils';

type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={cn('min-w-0', className)}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id={titleId} className="font-heading text-xl font-bold text-primary sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-primary-light">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('mt-5 min-w-0', contentClassName)}>{children}</div>
    </section>
  );
}
