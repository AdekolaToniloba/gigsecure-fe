import { Inbox } from 'lucide-react';
import { useId } from 'react';

type DashboardEmptyStateProps = {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export function DashboardEmptyState({
  title,
  message,
  icon,
  action,
}: DashboardEmptyStateProps) {
  const titleId = useId();

  return (
    <section
      role="status"
      aria-live="polite"
      aria-labelledby={titleId}
      className="flex min-h-64 min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-white p-6 text-center sm:p-8"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-primary"
      >
        {icon ?? <Inbox aria-hidden="true" className="h-6 w-6" />}
      </span>
      <h3 id={titleId} className="mt-4 text-balance font-heading text-lg font-bold text-primary">{title}</h3>
      <p className="mt-2 max-w-lg break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
        {message}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
