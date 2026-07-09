import { cn } from '@/lib/utils';

type PolicyStatusBadgeProps = {
  status: string;
};

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('expired')) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (normalized.includes('due')) {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }

  if (normalized.includes('active')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function PolicyStatusBadge({ status }: PolicyStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold',
        getStatusClasses(status),
      )}
    >
      <span className="truncate">{status}</span>
    </span>
  );
}
