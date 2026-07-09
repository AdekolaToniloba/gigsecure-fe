'use client';

import Link from 'next/link';
import { useLatestAssessment } from '@/hooks/risk/useRisk';
import { parseApiError } from '@/lib/api/errors';
import type { ProfileEditableField } from '@/lib/validators/user';
import type { ProfileResponse } from '@/types/profile';
import { RiskDataCardGrid } from './risk-data-card-grid';
import { RiskDataEditNote } from './risk-data-edit-note';
import { mapRiskDataCards } from './risk-data-mappers';
import { RefreshInsightsCard } from './refresh-insights-card';
import { RiskSectionCard } from './risk-section-card';

type RiskDataSectionProps = {
  profileResponse: ProfileResponse;
  staleFields?: readonly ProfileEditableField[];
  staleTags?: string[];
};

export function RiskDataSection({
  profileResponse,
  staleFields = [],
  staleTags = [],
}: RiskDataSectionProps) {
  const isAssessed = profileResponse.risk_assessed;
  const latestAssessment = useLatestAssessment({ enabled: isAssessed });

  if (!isAssessed) {
    return (
      <section className="rounded-2xl border border-app-border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-2xl font-bold text-primary">Risk data</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-light">
          Complete your first assessment to see the structured summary of your current risk profile here.
        </p>
        <Link
          href="/dashboard/risk-assessment"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Take assessment
        </Link>
      </section>
    );
  }

  if (latestAssessment.isPending) {
    return (
      <div role="status" aria-label="Loading latest risk data" className="rounded-2xl border border-app-border bg-white p-6 shadow-sm">
        <span className="sr-only">Loading latest risk data</span>
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    );
  }

  if (latestAssessment.isError || !latestAssessment.data) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-2xl font-bold text-primary">Risk data unavailable</h2>
        <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">
          {parseApiError(latestAssessment.error).message}
        </p>
        <button
          type="button"
          onClick={() => void latestAssessment.refetch()}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </section>
    );
  }

  const cards = mapRiskDataCards(profileResponse, latestAssessment.data);

  return (
    <div className="space-y-5">
      {staleFields.length > 0 && staleTags.length > 0 ? (
        <RefreshInsightsCard tags={staleTags} />
      ) : null}

      <RiskDataEditNote />

      <RiskDataCardGrid>
        {cards.map((card) => (
          <RiskSectionCard
            key={card.key}
            title={card.title}
            subtitle={card.subtitle}
            rows={card.rows}
            actionLabel="Update"
            actionHref="/dashboard/risk-assessment"
          />
        ))}
      </RiskDataCardGrid>

      <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-heading text-xl font-bold text-primary">Recommendations</h3>
          <ul className="mt-4 space-y-3">
            {latestAssessment.data.recommendations.map((recommendation, index) => (
              <li key={`${recommendation}-${index}`} className="rounded-xl bg-app-canvas px-4 py-3 text-sm leading-6 text-slate-700">
                {recommendation}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-heading text-xl font-bold text-primary">AI insights</h3>
          <p className="mt-4 text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">
            {latestAssessment.data.ai_insights.trim() || 'No AI insight summary is currently available.'}
          </p>
        </article>
      </section>
    </div>
  );
}
