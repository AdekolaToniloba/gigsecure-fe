import { getProfileFallbackText } from './profile-formatters';

type ProfileFieldRowProps = {
  label: string;
  value: React.ReactNode;
  emptyValue?: string | null | undefined;
};

export function ProfileFieldRow({
  label,
  value,
  emptyValue,
}: ProfileFieldRowProps) {
  const shouldUseFallback = value === null || value === undefined || value === '';

  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-app-border/70 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-sm font-medium text-primary-light">{label}</dt>
      <dd className="min-w-0 text-sm leading-6 text-slate-900 [overflow-wrap:anywhere]">
        {shouldUseFallback
          ? <span className="text-slate-500">{getProfileFallbackText(emptyValue)}</span>
          : value}
      </dd>
    </div>
  );
}
