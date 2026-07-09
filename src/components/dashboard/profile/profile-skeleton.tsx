export function ProfileSkeleton() {
  return (
    <section
      role="status"
      aria-label="Loading profile"
      className="mx-auto w-full max-w-7xl min-w-0 motion-reduce:[&_*]:animate-none"
    >
      <span className="sr-only">Loading profile</span>
      <div className="animate-pulse">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="h-10 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-5 w-72 max-w-full rounded bg-slate-200" />
          </div>
          <div className="h-24 w-full max-w-sm rounded-2xl bg-slate-200" />
        </div>
        <div className="mt-8 h-12 w-full rounded bg-slate-200" />
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="h-72 rounded-2xl bg-slate-200" />
          <div className="h-72 rounded-2xl bg-slate-200" />
          <div className="h-72 rounded-2xl bg-slate-200" />
          <div className="h-72 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </section>
  );
}
