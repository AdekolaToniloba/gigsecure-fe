import type {
  UserWithProfileResponse,
} from '@/types/api';
import type { DashboardOverviewResponse } from '@/types/dashboard';

export {
  assessmentHistoryFixture,
  dashboardAssessmentResponseFixture as latestAssessmentFixture,
} from './risk-assessment';

export const unassessedDashboardOverview: DashboardOverviewResponse = {
  premiums_bought: 0,
  monthly_income_band: null,
  safety_buffer: null,
  recommended_plans_count: 0,
  income_stability: null,
  has_assessment: false,
};

export const assessedDashboardOverview: DashboardOverviewResponse = {
  premiums_bought: 3,
  monthly_income_band: '₦300,000–₦500,000 per month',
  safety_buffer: 'Approximately three months of essential expenses',
  recommended_plans_count: 4,
  income_stability: {
    score: 42,
    classification: 'Moderate stability with seasonal income variation',
    graph_points: [18, 26, 22, 35, 31, 42, 38, 47],
  },
  has_assessment: true,
};

export const malformedDashboardOverview = {
  premiums_bought: -1,
  monthly_income_band: null,
  safety_buffer: null,
  recommended_plans_count: 1.5,
  income_stability: {
    score: 42,
    classification: 'Moderate',
    graph_points: '18,26,22',
  },
  has_assessment: 'yes',
};

export const dashboardOverviewError = {
  detail: 'Dashboard overview is temporarily unavailable.',
} as const;

const dashboardUser = {
  id: '00000000-0000-4000-8000-000000000042',
  email: 'oluwakanyinsola.adebayo@example.com',
  first_name: 'Oluwakanyinsola',
  last_name: 'Adebayo-Akinyemi',
  status: 'active',
  role: 'user',
  email_verified: true,
  phone_number: null,
  last_login_at: null,
  created_at: '2026-07-06T08:00:00Z',
};

export const dashboardProfileFixtures = {
  unassessedKycVerified: {
    user: dashboardUser,
    profile: null,
    kyc_verified: true,
    risk_assessed: false,
  },
  assessedKycUnverified: {
    user: dashboardUser,
    profile: null,
    kyc_verified: false,
    risk_assessed: true,
  },
} satisfies Record<string, UserWithProfileResponse>;
