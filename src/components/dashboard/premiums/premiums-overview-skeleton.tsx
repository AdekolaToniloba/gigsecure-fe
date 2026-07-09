export function PremiumsOverviewSkeleton() {
  return (
    <section
      aria-label="Loading protection overview"
      role="status"
      className="rounded-lg border border-app-border bg-white p-5 shadow-sm motion-reduce:[&_*]:animate-none sm:p-6"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-5 w-64 max-w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-lg bg-app-canvas p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-7 w-28 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
