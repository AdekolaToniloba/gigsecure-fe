import { cn } from '@/lib/utils';

export function AuthDivider({
  label = 'or',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 py-4 text-xs text-slate-600', className)}>
      <span className="h-px flex-1 bg-slate-200" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
