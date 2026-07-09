'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { RiskAssessmentWizard } from '@/components/risk-assessment/wizard';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import { useSession } from '@/hooks/auth/useSession';
import { useLatestAssessment } from '@/hooks/risk/useRisk';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { parseApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { buildLoginRedirect } from '@/lib/auth/redirects';
import { profileToWizardDefaults } from '@/lib/risk/profile-to-wizard-defaults';
import { useWizardStore } from '@/store/wizard-store';
import { useAuthStore } from '@/store/auth-store';
import type { AssessmentResponse } from '@/types/api';
import { RiskAssessmentError } from './risk-assessment-error';
import { RiskAssessmentSkeleton } from './risk-assessment-skeleton';
import { UnassessedState } from './unassessed-state';
import { AssessedReport } from '../report/assessed-report';

type ControllerView = 'summary' | 'initial-wizard' | 'reassessment-wizard' | 'completed';

export function DashboardRiskAssessmentController() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setFlags = useAuthStore((state) => state.setFlags);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { hasFullSession, status } = useSession();
  const { hasResolvedFlags, riskAssessed } = useUserFlags();
  const [view, setView] = useState<ControllerView>('summary');
  const profileQuery = useUserProfile({ enabled: hasFullSession });
  const shouldLoadLatest = Boolean(view === 'summary' && hasFullSession && (
    riskAssessed === true || profileQuery.data?.risk_assessed === true
  ));
  const latestQuery = useLatestAssessment({ enabled: shouldLoadLatest });
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const updateButtonRef = useRef<HTMLButtonElement>(null);
  const restoreStartFocus = useRef(false);
  const restoreUpdateFocus = useRef(false);
  const reassessmentHistoryActive = useRef(false);

  useEffect(() => {
    if (view !== 'summary') return;
    if (restoreStartFocus.current) {
      restoreStartFocus.current = false;
      startButtonRef.current?.focus();
    } else if (restoreUpdateFocus.current) {
      restoreUpdateFocus.current = false;
      updateButtonRef.current?.focus();
    }
  }, [view]);

  useEffect(() => {
    const handlePopState = () => {
      if (!reassessmentHistoryActive.current) return;
      reassessmentHistoryActive.current = false;
      restoreUpdateFocus.current = true;
      setView('summary');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const consumeReassessmentHistory = useCallback(() => {
    if (!reassessmentHistoryActive.current) return;
    reassessmentHistoryActive.current = false;
    window.history.back();
  }, []);

  const openWizard = useCallback(() => setView('initial-wizard'), []);
  const startReassessment = useCallback(() => {
    useWizardStore.getState().reset('dashboard');
    window.history.pushState(
      { ...window.history.state, gigsecureReassessment: true },
      '',
      window.location.href,
    );
    reassessmentHistoryActive.current = true;
    setView('reassessment-wizard');
  }, []);
  const cancelWizard = useCallback(() => {
    if (view === 'reassessment-wizard') {
      restoreUpdateFocus.current = true;
      consumeReassessmentHistory();
    } else {
      restoreStartFocus.current = true;
    }
    setView('summary');
  }, [consumeReassessmentHistory, view]);
  const handleDashboardSuccess = useCallback((assessment: AssessmentResponse) => {
    setFlags({ riskAssessed: true });
    queryClient.setQueryData(QUERY_KEYS.RISK_ASSESSMENT, assessment);
    const invalidations = [
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ME }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RISK_ASSESSMENT, refetchType: 'none' }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RISK_HISTORY }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RISK_RECOMMENDATIONS }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MARKETPLACE_RECOMMENDATIONS() }),
    ];
    useWizardStore.getState().reset('dashboard');
    void Promise.all(invalidations);
    if (view === 'reassessment-wizard') consumeReassessmentHistory();
    setView('completed');
  }, [consumeReassessmentHistory, queryClient, setFlags, view]);
  const handleAuthenticationFailure = useCallback(() => {
    clearAuth();
    router.replace(buildLoginRedirect('/dashboard/risk-assessment'));
  }, [clearAuth, router]);

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

  if (view === 'initial-wizard' || view === 'reassessment-wizard') {
    const initialDefaults = profileToWizardDefaults({
      mode: 'dashboard',
      profileResponse: profileQuery.data,
      resumedAnswers: useWizardStore.getState().progressByMode.dashboard.answers,
    });

    return (
      <PageFrame>
        {view === 'reassessment-wizard' ? (
          <p role="status" className="mb-4 rounded-xl border border-primary/20 bg-app-sidebar px-4 py-3 text-sm leading-6 text-primary">
            You&apos;re updating your assessment. Your saved report will remain unchanged until you submit.
          </p>
        ) : null}
        <RiskAssessmentWizard
          mode="dashboard"
          initialDefaults={initialDefaults}
          onCancel={cancelWizard}
          onSuccess={handleDashboardSuccess}
          onAuthenticationFailure={handleAuthenticationFailure}
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

  if (view === 'completed') {
    const completedAssessment = queryClient.getQueryData<AssessmentResponse>(
      QUERY_KEYS.RISK_ASSESSMENT,
    );
    if (completedAssessment) {
      return (
        <PageFrame>
          <AssessedReport
            assessment={completedAssessment}
            onReassess={startReassessment}
            updateButtonRef={updateButtonRef}
          />
        </PageFrame>
      );
    }
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
      <AssessedReport
        assessment={latestQuery.data}
        onReassess={startReassessment}
        updateButtonRef={updateButtonRef}
      />
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
