import { useId } from 'react';
import type { RiskReportDisplayModel } from '@/lib/risk/report-display-model';

type RiskScoreCardProps = {
  applicant: RiskReportDisplayModel['applicant'];
  score: RiskReportDisplayModel['score'];
  riskProfile: RiskReportDisplayModel['riskProfile'];
};

export function RiskScoreCard({ applicant, score, riskProfile }: RiskScoreCardProps) {
  const titleId = useId();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score.rounded / 100);

  return (
    <article
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col rounded-2xl bg-primary p-6 text-white shadow-sm sm:p-8"
    >
      <p className="text-sm font-semibold text-white/70">Latest assessment</p>
      <h3
        id={titleId}
        className="mt-2 break-words font-heading text-2xl font-bold leading-tight [overflow-wrap:anywhere]"
      >
        Your risk score
      </h3>
      <p className="mt-2 break-words text-sm leading-6 text-white/75 [overflow-wrap:anywhere]">
        Assessment for {applicant.fullName || 'you'}
      </p>

      <div className="mt-7 flex min-w-0 flex-col items-center text-center">
        <div className="relative h-44 w-44 shrink-0">
          <svg
            role="img"
            aria-label={score.accessibleText}
            data-visual-score={score.rounded}
            className="h-full w-full -rotate-90"
            viewBox="0 0 128 128"
          >
            <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="10" />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-4xl font-bold leading-none">{score.percentageText}</span>
            <span className="mt-2 text-xs font-medium text-white/70">overall score</span>
          </div>
        </div>
        <p className="mt-5 max-w-full break-words font-heading text-xl font-bold text-accent [overflow-wrap:anywhere]">
          {riskProfile}
        </p>
        <p className="mt-2 text-sm text-white/70">{score.rounded} out of 100</p>
      </div>
    </article>
  );
}
