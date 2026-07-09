import { PremiumsListSkeleton } from '@/components/dashboard/premiums/premiums-list-skeleton';
import { PremiumsOverviewSkeleton } from '@/components/dashboard/premiums/premiums-overview-skeleton';

export default function DashboardPremiumsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      <header className="min-w-0">
        <div className="h-9 w-64 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      </header>
      <PremiumsOverviewSkeleton />
      <section aria-label="Loading premiums list" className="min-w-0">
        <div className="mb-5 h-8 w-32 animate-pulse rounded bg-slate-200" />
        <PremiumsListSkeleton />
      </section>
    </div>
  );
}
