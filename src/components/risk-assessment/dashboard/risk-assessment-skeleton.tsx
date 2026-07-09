export function RiskAssessmentSkeleton() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading risk assessment"
      className="mx-auto w-full max-w-7xl min-w-0"
    >
      <span className="sr-only">Loading risk assessment…</span>
      <div aria-hidden="true" className="motion-reduce:[&_*]:animate-none">
        <div className="h-8 w-48 animate-pulse rounded-md bg-primary-muted" />
        <div className="mt-3 h-5 w-64 max-w-full animate-pulse rounded bg-primary-muted" />
        <div className="mt-7 flex min-h-[34rem] flex-col items-center justify-center rounded-2xl border border-app-border bg-white p-6">
          <div className="h-56 w-full max-w-sm animate-pulse rounded-2xl bg-primary-muted" />
          <div className="mt-7 h-7 w-64 max-w-full animate-pulse rounded bg-primary-muted" />
          <div className="mt-4 h-4 w-full max-w-lg animate-pulse rounded bg-primary-muted" />
          <div className="mt-2 h-4 w-4/5 max-w-md animate-pulse rounded bg-primary-muted" />
          <div className="mt-7 h-12 w-44 animate-pulse rounded-xl bg-primary-muted" />
        </div>
      </div>
    </section>
  );
}
