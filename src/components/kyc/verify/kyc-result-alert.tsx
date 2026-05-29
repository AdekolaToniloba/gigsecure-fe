import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KycVerifyStatus } from '@/types/kyc';

type KycResultAlertProps = {
  status: KycVerifyStatus | 'info';
  title: string;
  children: React.ReactNode;
  id?: string;
};

const styles = {
  verified: 'border-green-200 bg-green-50 text-green-800',
  rejected: 'border-amber-200 bg-amber-50 text-amber-900',
  failed: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-primary-muted bg-primary-muted text-primary',
};

const icons = {
  verified: CheckCircle2,
  rejected: AlertCircle,
  failed: AlertCircle,
  info: Info,
};

export function KycResultAlert({ status, title, children, id }: KycResultAlertProps) {
  const Icon = icons[status];
  const role = status === 'verified' || status === 'info' ? 'status' : 'alert';

  return (
    <div
      id={id}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      className={cn('flex gap-3 rounded-lg border p-4 text-sm', styles[status])}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 leading-6">{children}</div>
      </div>
    </div>
  );
}
