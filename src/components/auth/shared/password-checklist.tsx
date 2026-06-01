import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PasswordChecklistItem = {
  id: string;
  label: string;
  isValid: boolean;
};

export function PasswordChecklist({
  items,
  className,
}: {
  items: PasswordChecklistItem[];
  className?: string;
}) {
  return (
    <ul className={cn('space-y-2 text-xs text-slate-600', className)}>
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
              item.isValid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
            )}
            aria-hidden="true"
          >
            {item.isValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          <span className={cn(item.isValid && 'text-slate-800')}>{item.label}</span>
          <span className="sr-only">{item.isValid ? 'met' : 'not met'}</span>
        </li>
      ))}
    </ul>
  );
}
