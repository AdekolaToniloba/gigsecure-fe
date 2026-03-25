export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-primary">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-primary-light">
          Welcome back — here&apos;s an overview of your account.
        </p>
      </div>

      {/* Placeholder card grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-primary/10 bg-white/60 p-6 backdrop-blur-sm"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-primary-muted" />
            <div className="mt-4 h-8 w-16 animate-pulse rounded bg-primary-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
