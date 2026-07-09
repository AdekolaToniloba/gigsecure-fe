export function PremiumsListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading premiums"
      className="space-y-4 motion-reduce:[&_*]:animate-none"
    >
      {[0, 1].map((item) => (
        <div key={item} className="rounded-lg border border-app-border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-5 w-64 max-w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((metric) => (
              <div key={metric} className="h-24 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
