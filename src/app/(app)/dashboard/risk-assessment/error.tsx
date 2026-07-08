'use client';

import { RiskAssessmentError } from '@/components/risk-assessment/dashboard/risk-assessment-error';

type DashboardRiskAssessmentRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardRiskAssessmentRouteError({
  reset,
}: DashboardRiskAssessmentRouteErrorProps) {
  return (
    <section
      aria-labelledby="dashboard-risk-assessment-error-title"
      className="mx-auto w-full max-w-7xl min-w-0"
    >
      <h1
        id="dashboard-risk-assessment-error-title"
        className="font-heading text-2xl font-bold text-primary sm:text-3xl"
      >
        Risk assessment
      </h1>
      <p className="mt-2 text-sm leading-6 text-primary-light sm:text-base">
        Get to know your risk profile.
      </p>
      <div className="mt-7 min-w-0">
        <RiskAssessmentError
          title="Risk assessment unavailable"
          message="Something unexpected interrupted your risk assessment. Please try loading it again."
          onRetry={reset}
        />
      </div>
    </section>
  );
}
