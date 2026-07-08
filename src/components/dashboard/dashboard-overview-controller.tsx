'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardOverviewContent } from '@/components/dashboard/dashboard-overview-content';
import { DashboardErrorState } from '@/components/dashboard/overview/dashboard-error-state';
import { DashboardSkeleton } from '@/components/dashboard/overview/dashboard-skeleton';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import { useDashboardOverview } from '@/hooks/dashboard/useDashboard';
import { useLatestAssessment } from '@/hooks/risk/useRisk';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import { parseApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';

type DashboardOverviewControllerProps = {
  date: Date;
};

export function DashboardOverviewController({ date }: DashboardOverviewControllerProps) {
  const queryClient = useQueryClient();
  const {
    hasResolvedFlags,
    kycVerified,
    riskAssessed,
    status,
  } = useUserFlags();
  const isAuthenticated = status === 'authenticated';
  const profileQuery = useUserProfile();
  const overviewQuery = useDashboardOverview({ enabled: isAuthenticated });
  const shouldLoadAssessment = isAuthenticated && (
    riskAssessed === true || overviewQuery.data?.has_assessment === true
  );
  const assessmentQuery = useLatestAssessment({ enabled: shouldLoadAssessment });
  const hasPersistentAssessmentMismatch = Boolean(
    overviewQuery.isSuccess
      && profileQuery.isSuccess
      && hasResolvedFlags
      && overviewQuery.data.has_assessment !== riskAssessed,
  );

  useEffect(() => {
    if (!hasPersistentAssessmentMismatch) return;

    console.warn(
      '[Dashboard] Overview assessment state differs from the shared user flag; refreshing /users/me.',
    );
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ME });
  }, [hasPersistentAssessmentMismatch, queryClient]);

  if (status === 'idle' || status === 'initializing' || !isAuthenticated) {
    return <DashboardSkeleton />;
  }

  if (!hasResolvedFlags) {
    if (profileQuery.isError) {
      return (
        <DashboardErrorState
          title="Account details unavailable"
          message={parseApiError(profileQuery.error).message}
          onRetry={() => void profileQuery.refetch()}
        />
      );
    }
    return <DashboardSkeleton />;
  }

  if (overviewQuery.isPending) return <DashboardSkeleton />;

  if (overviewQuery.isError) {
    return (
      <DashboardErrorState
        message={parseApiError(overviewQuery.error).message}
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const assessment = !overviewQuery.data.has_assessment || assessmentQuery.isPending
    ? { status: 'loading' as const }
    : assessmentQuery.isError
      ? {
          status: 'error' as const,
          message: parseApiError(assessmentQuery.error).message,
          onRetry: () => void assessmentQuery.refetch(),
        }
      : assessmentQuery.data
        ? { status: 'success' as const, data: assessmentQuery.data }
        : { status: 'loading' as const };

  return (
    <DashboardOverviewContent
      overview={overviewQuery.data}
      profile={profileQuery.data}
      kycVerified={kycVerified === true}
      riskAssessed={riskAssessed === true}
      assessment={assessment}
      date={date}
    />
  );
}
