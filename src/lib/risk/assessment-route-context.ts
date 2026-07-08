export type AssessmentMode = 'public' | 'dashboard';

export type AssessmentRouteRecovery = {
  onAuthenticationFailure: () => void;
};

type CreateAssessmentRouteContextOptions = {
  mode: AssessmentMode;
  hasAccessToken: boolean;
  hasFullSession: boolean;
  recovery: AssessmentRouteRecovery;
};

export type AssessmentRouteContext = {
  mode: AssessmentMode;
  canAccessRoute: boolean;
  canUseRiskApi: boolean;
  canQueryProfile: boolean;
  canQueryDashboard: boolean;
  canQueryKyc: boolean;
  canQueryMarketplaceRecommendations: boolean;
  recoverFromAuthenticationFailure: () => void;
};

export function createAssessmentRouteContext({
  mode,
  hasAccessToken,
  hasFullSession,
  recovery,
}: CreateAssessmentRouteContextOptions): AssessmentRouteContext {
  const isDashboard = mode === 'dashboard';
  const hasDashboardCapability = isDashboard && hasFullSession;

  return {
    mode,
    canAccessRoute: isDashboard ? hasFullSession : hasAccessToken,
    canUseRiskApi: hasAccessToken,
    canQueryProfile: hasDashboardCapability,
    canQueryDashboard: hasDashboardCapability,
    canQueryKyc: hasDashboardCapability,
    canQueryMarketplaceRecommendations: hasDashboardCapability,
    recoverFromAuthenticationFailure: recovery.onAuthenticationFailure,
  };
}
