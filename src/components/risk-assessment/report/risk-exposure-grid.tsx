import { useId } from 'react';
import type { RiskReportDisplayModel } from '@/lib/risk/report-display-model';
import { RiskExposureCard } from './risk-exposure-card';

type RiskExposureGridProps = {
  exposures: RiskReportDisplayModel['exposures'];
};

export function RiskExposureGrid({ exposures }: RiskExposureGridProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="mt-8 min-w-0">
      <h3 id={titleId} className="font-heading text-2xl font-bold text-primary">
        Risk exposure breakdown
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-light sm:text-base">
        Your five assessment pillars, shown as validated scores out of 100.
      </p>
      <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {exposures.map((exposure) => (
          <RiskExposureCard key={exposure.key} exposure={exposure} />
        ))}
      </div>
    </section>
  );
}
