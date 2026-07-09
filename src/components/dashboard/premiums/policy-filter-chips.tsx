import { cn } from '@/lib/utils';
import type { PremiumsFilter } from '@/types/policies';

const FILTERS: Array<{ id: PremiumsFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'All Active' },
  { id: 'due-soon', label: 'Due Soon' },
  { id: 'expired', label: 'Expired' },
];

type PolicyFilterChipsProps = {
  selected: PremiumsFilter;
  onChange: (filter: PremiumsFilter) => void;
};

export function PolicyFilterChips({ selected, onChange }: PolicyFilterChipsProps) {
  return (
    <div
      aria-label="Premium filters"
      className="flex min-w-0 gap-2 overflow-x-auto pb-1"
      role="group"
    >
      {FILTERS.map((filter) => {
        const isSelected = selected === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(filter.id)}
            className={cn(
              'min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isSelected
                ? 'border-accent bg-accent text-primary'
                : 'border-app-border bg-white text-primary hover:bg-primary-muted',
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
