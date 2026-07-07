import type {
  AssessmentResponse,
  AssessmentSummary,
  UserWithProfileResponse,
} from '@/types/api';
import type { DashboardOverviewResponse } from '@/types/dashboard';

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

export const latestAssessmentFixture: AssessmentResponse = {
  applicant: {
    first_name: 'Oluwakanyinsola',
    last_name: 'Adebayo-Akinyemi',
    age: 31,
    gender: 'female',
    marital_status: 'single',
    state: 'Lagos',
    city: 'Ikeja',
  },
  category: 'tech_freelancer',
  pillar_scores: {
    income: 72,
    client: 45,
    safety: 80,
    equipment: 35,
    health: 55,
  },
  overall_score: 68.5,
  risk_profile: 'Moderate Risk',
  recommendations: [
    'Build an emergency reserve that can cover at least three months of essential expenses.',
    'Consider income protection suited to irregular freelance earnings.',
  ],
  recommended_categories: ['Income Protection', 'Equipment Protection'],
  ai_insights: 'Income is moderately stable, with some exposure to client concentration.',
};

export const assessmentHistoryFixture: AssessmentSummary[] = [
  {
    id: 'assessment-summary-001',
    category: 'tech_freelancer',
    first_name: 'Oluwakanyinsola',
    last_name: 'Adebayo-Akinyemi',
    age: 31,
    overall_score: 68.5,
    risk_profile: 'Moderate Risk',
    created_at: '2026-07-06T09:30:00Z',
  },
  {
    id: 'assessment-summary-002',
    category: 'tech_freelancer',
    first_name: null,
    last_name: null,
    age: null,
    overall_score: 54,
    risk_profile: 'Moderate Risk',
    created_at: '2026-04-02T13:15:00Z',
  },
];
