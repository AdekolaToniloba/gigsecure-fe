import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthStatus({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        'mx-auto flex w-full max-w-[21rem] flex-col items-center rounded-2xl bg-primary-muted px-8 py-12 text-center',
        className
      )}
    >
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
        {icon ?? <Check aria-hidden="true" className="h-7 w-7" />}
      </div>
      <h1 className="text-pretty font-heading text-2xl font-bold text-slate-900">{title}</h1>
      {description && (
        <p className="mt-3 max-w-[16rem] text-pretty text-sm leading-5 text-slate-500">{description}</p>
      )}
    </section>
  );
}
