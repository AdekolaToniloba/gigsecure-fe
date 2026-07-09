import { cn } from '@/lib/utils';

type ProfileStatusTone = 'neutral' | 'success' | 'warning' | 'error';

const toneClasses: Record<ProfileStatusTone, string> = {
  neutral: 'border-primary/15 bg-app-sidebar text-primary',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
};

type ProfileStatusProps = {
  label: string;
  tone?: ProfileStatusTone;
  className?: string;
};

export function ProfileStatus({
  label,
  tone = 'neutral',
  className,
}: ProfileStatusProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
