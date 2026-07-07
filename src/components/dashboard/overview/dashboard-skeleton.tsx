const METRIC_SKELETONS = ['premium', 'income', 'buffer', 'plans'] as const;

export function DashboardSkeleton() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard overview"
      className="mx-auto w-full max-w-7xl"
    >
      <span className="sr-only">Loading dashboard overview…</span>
      <div aria-hidden="true" className="space-y-6 motion-reduce:[&_*]:animate-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-md bg-primary-muted" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded bg-primary-muted" />
          </div>
          <div className="h-11 w-52 max-w-full animate-pulse rounded-lg bg-white ring-1 ring-app-border" />
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <div className="h-64 animate-pulse rounded-xl bg-white ring-1 ring-app-border" />
          <div className="h-64 animate-pulse rounded-xl bg-white ring-1 ring-app-border" />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRIC_SKELETONS.map((metric) => (
            <div
              key={metric}
              data-dashboard-skeleton="metric"
              className="h-52 animate-pulse rounded-xl bg-white ring-1 ring-app-border"
            />
          ))}
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <div className="h-80 animate-pulse rounded-xl bg-white ring-1 ring-app-border" />
          <div className="h-80 animate-pulse rounded-xl bg-white ring-1 ring-app-border" />
        </div>
      </div>
    </section>
  );
}
