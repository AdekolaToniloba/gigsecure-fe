import Link from 'next/link';

type RefreshInsightsCardProps = {
  tags: string[];
  lastGeneratedLabel?: string | null;
};

export function RefreshInsightsCard({
  tags,
  lastGeneratedLabel,
}: RefreshInsightsCardProps) {
  return (
    <section
      aria-labelledby="refresh-insights-title"
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 text-amber-950"
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Risk insights</p>
          <h3 id="refresh-insights-title" className="mt-2 font-heading text-xl font-bold">
            Your latest profile changes may affect this summary
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-950/80">
            Update your full assessment to refresh the score, recommendations, and AI-generated guidance shown here.
          </p>
          {lastGeneratedLabel ? (
            <p className="mt-2 text-sm text-amber-950/70">{lastGeneratedLabel}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex min-h-8 items-center rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3">
          <Link
            href="/dashboard/risk-assessment"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Update assessment
          </Link>
          <p className="max-w-xs text-xs leading-5 text-amber-950/70">
            AI insights are based on your latest completed assessment and are not updated in real time.
          </p>
        </div>
      </div>
    </section>
  );
}
