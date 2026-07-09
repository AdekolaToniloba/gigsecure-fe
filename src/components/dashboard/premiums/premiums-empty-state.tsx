import Link from 'next/link';
import { ShieldPlus } from 'lucide-react';

export function PremiumsEmptyState() {
  return (
    <section
      aria-labelledby="premiums-empty-title"
      className="min-w-0 rounded-lg border border-dashed border-primary/25 bg-white p-6 text-center sm:p-10"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-muted text-primary"
      >
        <ShieldPlus className="h-10 w-10" />
      </div>
      <h2
        id="premiums-empty-title"
        className="mx-auto mt-6 max-w-2xl text-balance font-heading text-2xl font-bold text-primary"
      >
        You haven&apos;t activated any protection plans yet
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-primary-light sm:text-base">
        Explore recommended plans based on your risk profile and start protecting your income,
        equipment, health, and work continuity.
      </p>
      <div className="mt-7 flex min-w-0 flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/marketplace"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-accent transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Explore Recommended Plans
        </Link>
        <Link
          href="/dashboard/risk-assessment"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          View My Risk Assessment
        </Link>
      </div>
    </section>
  );
}
