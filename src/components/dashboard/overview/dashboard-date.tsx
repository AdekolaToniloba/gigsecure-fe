import { CalendarDays } from 'lucide-react';
import { formatDashboardDate, UNAVAILABLE_VALUE } from '@/lib/dashboard/formatters';
import { cn } from '@/lib/utils';

type DashboardDateProps = {
  date: Date;
  locale?: string;
  timeZone?: string;
  className?: string;
};

export function DashboardDate({ date, locale, timeZone, className }: DashboardDateProps) {
  const label = formatDashboardDate(date, locale, timeZone);
  const isValidDate = label !== UNAVAILABLE_VALUE;

  return (
    <div
      className={cn(
        'inline-flex min-h-[3.75rem] w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-accent-alt bg-[#fffdf0] px-4 py-2 text-sm font-semibold text-primary shadow-sm sm:w-[15rem]',
        className
      )}
    >
      <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
      <time dateTime={isValidDate ? date.toISOString() : undefined} className="min-w-0 break-words">
        {label}
      </time>
    </div>
  );
}
