import { describe, expect, it, vi } from 'vitest';
import { createAssessmentRouteContext } from '@/lib/risk/assessment-route-context';

describe('createAssessmentRouteContext', () => {
  it('allows a public token to use risk APIs without full-session capabilities', () => {
    const recover = vi.fn();
    const context = createAssessmentRouteContext({
      mode: 'public',
      hasAccessToken: true,
      hasFullSession: false,
      recovery: { onAuthenticationFailure: recover },
    });

    expect(context).toMatchObject({
      mode: 'public',
      canAccessRoute: true,
      canUseRiskApi: true,
      canQueryProfile: false,
      canQueryDashboard: false,
      canQueryKyc: false,
      canQueryMarketplaceRecommendations: false,
    });

    context.recoverFromAuthenticationFailure();
    expect(recover).toHaveBeenCalledTimes(1);
  });

  it('grants dashboard-only capabilities only to a full session', () => {
    const context = createAssessmentRouteContext({
      mode: 'dashboard',
      hasAccessToken: true,
      hasFullSession: true,
      recovery: { onAuthenticationFailure: vi.fn() },
    });

    expect(context).toMatchObject({
      canAccessRoute: true,
      canUseRiskApi: true,
      canQueryProfile: true,
      canQueryDashboard: true,
      canQueryKyc: true,
      canQueryMarketplaceRecommendations: true,
    });
  });

  it('does not admit a waitlist-token user to the dashboard route', () => {
    const context = createAssessmentRouteContext({
      mode: 'dashboard',
      hasAccessToken: true,
      hasFullSession: false,
      recovery: { onAuthenticationFailure: vi.fn() },
    });

    expect(context.canUseRiskApi).toBe(true);
    expect(context.canAccessRoute).toBe(false);
    expect(context.canQueryProfile).toBe(false);
    expect(context.canQueryDashboard).toBe(false);
    expect(context.canQueryKyc).toBe(false);
    expect(context.canQueryMarketplaceRecommendations).toBe(false);
  });

  it('requires an in-memory token before public risk work begins', () => {
    const context = createAssessmentRouteContext({
      mode: 'public',
      hasAccessToken: false,
      hasFullSession: false,
      recovery: { onAuthenticationFailure: vi.fn() },
    });

    expect(context.canAccessRoute).toBe(false);
    expect(context.canUseRiskApi).toBe(false);
  });
});
