export default function DashboardSettingsLoading() {
  return (
    <div role="status" aria-label="Loading settings" className="mx-auto w-full max-w-7xl">
      <div className="border-b border-app-border">
        <div className="flex gap-8">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 w-32 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
      </div>
      <div className="mt-8 max-w-3xl space-y-4 motion-reduce:[&_*]:animate-none">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-8 space-y-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex min-h-20 items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-4 w-52 max-w-full animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-80 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-8 w-14 shrink-0 animate-pulse rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
