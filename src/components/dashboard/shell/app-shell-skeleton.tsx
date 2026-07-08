export function AppShellSkeleton() {
  return (
    <section
      role="status"
      aria-label="Loading protected application"
      className="mx-auto w-full max-w-7xl"
    >
      <span className="sr-only">Loading your dashboard…</span>
      <div aria-hidden="true" className="space-y-6 motion-reduce:[&_*]:animate-none">
        <div className="h-8 w-40 animate-pulse rounded-md bg-primary-muted" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <div className="h-64 animate-pulse rounded-xl bg-white ring-1 ring-app-border" />
          <div className="h-64 animate-pulse rounded-xl bg-white ring-1 ring-app-border" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl bg-white ring-1 ring-app-border"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
