'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RiskAssessmentWizard } from '@/components/risk-assessment/wizard';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import { useSession } from '@/hooks/auth/useSession';
import { useLatestAssessment } from '@/hooks/risk/useRisk';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { parseApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { profileToWizardDefaults } from '@/lib/risk/profile-to-wizard-defaults';
import { useWizardStore } from '@/store/wizard-store';
import type { AssessmentResponse } from '@/types/api';
import { RiskAssessmentError } from './risk-assessment-error';
import { RiskAssessmentSkeleton } from './risk-assessment-skeleton';
import { UnassessedState } from './unassessed-state';

type ControllerView = 'summary' | 'wizard';

function noop() {}

export function DashboardRiskAssessmentController() {
  const queryClient = useQueryClient();
  const { hasFullSession, status } = useSession();
  const { hasResolvedFlags, riskAssessed } = useUserFlags();
  const profileQuery = useUserProfile({ enabled: hasFullSession });
  const shouldLoadLatest = Boolean(hasFullSession && (
    riskAssessed === true || profileQuery.data?.risk_assessed === true
  ));
  const latestQuery = useLatestAssessment({ enabled: shouldLoadLatest });
  const [view, setView] = useState<ControllerView>('summary');
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const restoreStartFocus = useRef(false);

  useEffect(() => {
    if (view !== 'summary' || !restoreStartFocus.current) return;
    restoreStartFocus.current = false;
    startButtonRef.current?.focus();
  }, [view]);

  const openWizard = useCallback(() => setView('wizard'), []);
  const cancelWizard = useCallback(() => {
    restoreStartFocus.current = true;
    setView('summary');
  }, []);

  if (status === 'idle' || status === 'initializing' || !hasFullSession) {
    return <RiskAssessmentSkeleton />;
  }

  if (profileQuery.isPending) {
    return <RiskAssessmentSkeleton />;
  }

  if (profileQuery.isError) {
    return (
      <PageFrame>
        <RiskAssessmentError
          title="Account details unavailable"
          message={parseApiError(profileQuery.error).message}
          onRetry={() => void profileQuery.refetch()}
        />
      </PageFrame>
    );
  }

  if (!hasResolvedFlags) {
    return <RiskAssessmentSkeleton />;
  }

  if (view === 'wizard') {
    const initialDefaults = profileToWizardDefaults({
      mode: 'dashboard',
      profileResponse: profileQuery.data,
      resumedAnswers: useWizardStore.getState().progressByMode.dashboard.answers,
    });

    return (
      <PageFrame>
        <RiskAssessmentWizard
          mode="dashboard"
          initialDefaults={initialDefaults}
          onCancel={cancelWizard}
          onSuccess={noop}
          onAuthenticationFailure={noop}
          renderSuccess={(assessment) => <AssessmentSummary assessment={assessment} />}
          shell={{
            rootClassName: 'min-h-0 rounded-2xl border border-app-border bg-white pt-4 sm:pt-6',
            contentClassName: 'max-w-6xl px-3 pb-6 sm:px-6',
            loadingClassName: 'min-h-[34rem] rounded-2xl border border-app-border bg-white',
            resumeBannerClassName: 'sticky top-0 rounded-t-2xl',
          }}
        />
      </PageFrame>
    );
  }

  if (!profileQuery.data.risk_assessed) {
    return (
      <PageFrame>
        <UnassessedState onStart={openWizard} startButtonRef={startButtonRef} />
      </PageFrame>
    );
  }

  if (latestQuery.isPending) {
    return <RiskAssessmentSkeleton />;
  }

  if (latestQuery.isError || !latestQuery.data) {
    const error = parseApiError(latestQuery.error);
    const isReconciliationError = error.statusCode === 404;

    return (
      <PageFrame>
        <RiskAssessmentError
          title={isReconciliationError ? 'Assessment record needs attention' : 'Risk report unavailable'}
          message={isReconciliationError
            ? 'Your profile says an assessment exists, but the report could not be found. Try again while we refresh your account details.'
            : error.message}
          onRetry={() => {
            void latestQuery.refetch();
            if (isReconciliationError) {
              void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ME });
            }
          }}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <AssessmentSummary assessment={latestQuery.data} />
    </PageFrame>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="dashboard-risk-assessment-title" className="mx-auto w-full max-w-7xl min-w-0">
      <h1
        id="dashboard-risk-assessment-title"
        className="font-heading text-2xl font-bold text-primary sm:text-3xl"
      >
        Risk assessment
      </h1>
      <p className="mt-2 text-sm leading-6 text-primary-light sm:text-base">
        Get to know your risk profile.
      </p>
      <div className="mt-7 min-w-0">{children}</div>
    </section>
  );
}

function AssessmentSummary({ assessment }: { assessment: AssessmentResponse }) {
  const applicantName = [assessment.applicant.first_name, assessment.applicant.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      aria-labelledby="assessment-summary-title"
      className="min-w-0 rounded-2xl border border-app-border bg-white p-6 shadow-sm sm:p-8"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-primary-light">
        Latest assessment
      </p>
      <h2
        id="assessment-summary-title"
        tabIndex={-1}
        className="mt-2 break-words font-heading text-2xl font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {applicantName ? `${applicantName}’s risk profile` : 'Your risk profile'}
      </h2>
      <p className="mt-4 break-words text-base font-semibold text-slate-800">
        {assessment.risk_profile}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Overall score: {assessment.overall_score} out of 100
      </p>
      <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
        Your assessment is complete. Your latest score and risk profile are shown above.
      </p>
    </section>
  );
}
