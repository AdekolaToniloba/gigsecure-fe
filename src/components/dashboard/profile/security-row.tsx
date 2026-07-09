import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type SecurityRowAction =
  | {
      kind: 'button';
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }
  | {
      kind: 'link';
      label: string;
      href: string;
    };

type SecurityRowProps = {
  icon: LucideIcon;
  label: string;
  helperText: string;
  status: React.ReactNode;
  action?: SecurityRowAction;
  loading?: boolean;
  extra?: React.ReactNode;
};

export function SecurityRow({
  icon: Icon,
  label,
  helperText,
  status,
  action,
  loading = false,
  extra,
}: SecurityRowProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-app-border/70 py-5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-sidebar text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-primary">{label}</h3>
          <p className="mt-1 text-sm leading-6 text-primary-light [overflow-wrap:anywhere]">
            {helperText}
          </p>
          <div className="mt-3">{loading ? <span className="text-sm text-slate-500">Loading…</span> : status}</div>
          {extra ? <div className="mt-3">{extra}</div> : null}
        </div>
      </div>

      {action ? (
        action.kind === 'button' ? (
          <button
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {action.label}
          </button>
        ) : (
          <Link
            href={action.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {action.label}
          </Link>
        )
      ) : null}
    </div>
  );
}
