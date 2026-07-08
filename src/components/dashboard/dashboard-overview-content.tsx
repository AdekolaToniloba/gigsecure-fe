import {
  Banknote,
  BriefcaseBusiness,
  PiggyBank,
  ShieldCheck,
} from 'lucide-react';
import { AssessedOverview } from '@/components/dashboard/overview/assessed-hero';
import { DashboardDate } from '@/components/dashboard/overview/dashboard-date';
import { GettingStartedChecklist } from '@/components/dashboard/overview/getting-started-checklist';
import { IncomeStabilityCard } from '@/components/dashboard/overview/income-stability-card';
import { MetricCard, MetricCardGrid } from '@/components/dashboard/overview/metric-card';
import { RecommendedActions } from '@/components/dashboard/overview/recommended-actions';
import {
  RiskLevelCard,
  RiskLevelCardError,
  RiskLevelCardSkeleton,
} from '@/components/dashboard/overview/risk-level-card';
import { UnassessedOverview } from '@/components/dashboard/overview/unassessed-hero';
import { NotificationPreview } from '@/components/dashboard/notifications/notification-preview';
import { KycDashboardBanner } from '@/components/kyc/dashboard/kyc-dashboard-banner';
import { getDashboardGreeting } from '@/lib/dashboard/formatters';
import type { AssessmentResponse, UserWithProfileResponse } from '@/types/api';
import type { DashboardOverviewResponse } from '@/types/dashboard';

type AssessmentState =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'success'; data: AssessmentResponse };

type DashboardOverviewContentProps = {
  overview: DashboardOverviewResponse;
  profile: UserWithProfileResponse | undefined;
  kycVerified: boolean;
  riskAssessed: boolean;
  assessment: AssessmentState;
  date: Date;
};

function AssessmentRiskLevel({ assessment }: { assessment: AssessmentState }) {
  if (assessment.status === 'loading') return <RiskLevelCardSkeleton />;
  if (assessment.status === 'error') {
    return (
      <RiskLevelCardError
        message={assessment.message}
        onRetry={assessment.onRetry}
      />
    );
  }

  return <RiskLevelCard {...assessment.data} />;
}

export function DashboardOverviewContent({
  overview,
  profile,
  kycVerified,
  riskAssessed,
  assessment,
  date,
}: DashboardOverviewContentProps) {
  const firstName = profile?.user.first_name.trim();
  const greeting = getDashboardGreeting(date);
  const isAssessed = overview.has_assessment;

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0" data-dashboard-state={isAssessed ? 'assessed' : 'unassessed'}>
      <KycDashboardBanner />

      <header className="mb-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance font-heading text-[2rem] font-bold leading-tight text-primary">Dashboard</h1>
          <p className="mt-1 break-words text-base leading-6 text-primary-light [overflow-wrap:anywhere] sm:text-lg">
            {greeting}{firstName ? `, ${firstName}` : ''}. Here&apos;s your account overview.
          </p>
        </div>
        <DashboardDate date={date} className="self-start" />
      </header>

      {isAssessed ? (
        <AssessedOverview riskLevel={<AssessmentRiskLevel assessment={assessment} />} />
      ) : (
        <UnassessedOverview />
      )}

      <section aria-label="Dashboard metrics" className="mt-5 min-w-0">
        <MetricCardGrid>
          <MetricCard
            label="Premiums Bought"
            value={overview.premiums_bought}
            icon={<BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />}
            supportingText="Protection plans purchased through GigSecure."
          />
          <MetricCard
            label="Monthly Income"
            value={overview.monthly_income_band}
            icon={<Banknote aria-hidden="true" className="h-5 w-5" />}
            supportingText="Income band from your latest validated assessment."
          />
          <MetricCard
            label="Safety Buffer"
            value={overview.safety_buffer}
            icon={<PiggyBank aria-hidden="true" className="h-5 w-5" />}
            supportingText="Your available financial resilience estimate."
          />
          <MetricCard
            label="Recommended Plans"
            value={overview.recommended_plans_count}
            icon={<ShieldCheck aria-hidden="true" className="h-5 w-5" />}
            supportingText="Plans matched to your current assessment."
          />
        </MetricCardGrid>
      </section>

      <div className={`mt-5 grid min-w-0 grid-cols-1 gap-5 ${isAssessed ? 'lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]' : 'lg:grid-cols-2'}`}>
        <IncomeStabilityCard stability={overview.income_stability ?? null} />

        <div className="grid min-w-0 content-start gap-5">
          {isAssessed ? (
            assessment.status === 'success' ? (
              <RecommendedActions
                recommendations={assessment.data.recommendations}
                kycVerified={kycVerified}
              />
            ) : null
          ) : (
            <GettingStartedChecklist
              riskAssessed={riskAssessed}
              kycVerified={kycVerified}
              emailVerified={profile?.user.email_verified === true}
            />
          )}
          {isAssessed ? <NotificationPreview /> : null}
        </div>
      </div>
    </div>
  );
}
