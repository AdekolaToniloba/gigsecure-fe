import Link from 'next/link';
import { ArrowRight, ChartNoAxesCombined, PlayCircle } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type AssessedHeroProps = {
  description?: string;
  className?: string;
};

type AssessedOverviewProps = {
  riskLevel: React.ReactNode;
  heroDescription?: string;
  className?: string;
};

const DEFAULT_DESCRIPTION =
  'See your financial position at a glance and explore protection that fits your latest risk assessment.';

export function AssessedHero({
  description = DEFAULT_DESCRIPTION,
  className,
}: AssessedHeroProps) {
  const titleId = useId();
  const unavailableDescriptionId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'relative flex min-h-64 min-w-0 overflow-hidden rounded-xl bg-primary px-6 py-8 text-white shadow-sm sm:p-8 lg:min-h-[19.5rem]',
        className
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[3rem] border-white/[0.06]" />
        <span className="absolute -bottom-24 right-20 h-52 w-52 rounded-full bg-accent/[0.08]" />
        <ChartNoAxesCombined
          className="absolute bottom-6 right-7 hidden h-28 w-28 text-white/[0.08] sm:block"
          strokeWidth={1.2}
        />
      </div>

      <div className="relative z-10 flex min-w-0 max-w-2xl flex-1 flex-col justify-center">
        <p className="mb-4 text-sm font-semibold text-white/90">Gig Secure</p>
        <h2
          id={titleId}
          className="break-words font-heading text-3xl font-bold leading-tight [overflow-wrap:anywhere] sm:text-4xl"
        >
          Here’s your financial snapshot.
        </h2>
        <p className="mt-4 max-w-xl min-w-0 break-words text-sm leading-6 text-white/80 [overflow-wrap:anywhere] sm:text-base sm:leading-7">
          {description}
        </p>

        <div className="mt-7 flex min-w-0 flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="inline-flex min-h-11 min-w-0 touch-manipulation items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-accent-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Explore Marketplace
            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </Link>
          <button
            type="button"
            disabled
            aria-describedby={unavailableDescriptionId}
            className="inline-flex min-h-11 min-w-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/60 px-5 py-2 text-sm font-semibold text-white/65"
          >
            <PlayCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            View Product Demo
          </button>
          <span id={unavailableDescriptionId} className="sr-only">
            The product demo is coming soon.
          </span>
        </div>
      </div>
    </article>
  );
}

export function AssessedOverview({
  riskLevel,
  heroDescription,
  className,
}: AssessedOverviewProps) {
  return (
    <section
      aria-label="Financial snapshot"
      className={cn(
        'grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]',
        className
      )}
    >
      <AssessedHero description={heroDescription} />
      <div className="min-w-0">{riskLevel}</div>
    </section>
  );
}
