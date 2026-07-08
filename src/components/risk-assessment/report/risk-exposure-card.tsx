import { useId } from 'react';
import type { RiskExposureDisplay } from '@/lib/risk/report-display-model';

type RiskExposureCardProps = {
  exposure: RiskExposureDisplay;
};

export function RiskExposureCard({ exposure }: RiskExposureCardProps) {
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className="flex min-h-40 min-w-0 flex-col rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6"
    >
      <h4
        id={titleId}
        className="break-words font-heading text-base font-bold leading-snug text-primary [overflow-wrap:anywhere]"
      >
        {exposure.label}
      </h4>

      <div className="mt-auto pt-6">
        <div
          role="progressbar"
          aria-label={exposure.scoreText}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={exposure.score}
          aria-valuetext={`${exposure.roundedScore} out of 100`}
          className="h-2.5 w-full overflow-hidden rounded-full bg-app-sidebar"
        >
          <div
            aria-hidden="true"
            className="h-full rounded-full bg-primary-light"
            style={{ width: `${exposure.score}%` }}
          />
        </div>
        <p className="mt-3 text-sm font-semibold text-primary">
          {exposure.roundedScore} <span className="font-normal text-primary-light">out of 100</span>
        </p>
      </div>
    </article>
  );
}
