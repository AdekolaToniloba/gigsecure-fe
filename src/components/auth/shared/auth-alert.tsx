import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthAlertVariant = 'error' | 'success' | 'info';

const variantStyles: Record<AuthAlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-primary-muted bg-primary-muted text-primary',
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function AuthAlert({
  id,
  variant = 'info',
  title,
  children,
  className,
}: {
  id?: string;
  variant?: AuthAlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = icons[variant];

  return (
    <div
      id={id}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn('flex gap-3 rounded-lg border p-3 text-sm', variantStyles[variant], className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-1')}>{children}</div>
      </div>
    </div>
  );
}
