import type { AssessmentResponse } from '@/types/api';

export const mockAssessmentResponse: AssessmentResponse = {
  id: 'assess-test-001',
  user_id: 'user-test-001',
  overall_score: 68.5,
  risk_profile: 'Moderate Risk',
  pillar_scores: {
    income: 72,
    client: 45,
    safety: 80,
    equipment: 35,
    health: 55,
  },
  recommendations: [
    'Consider income protection insurance to cover gaps between projects',
    'Diversify your client base to reduce dependency risk',
    'Build an emergency fund covering at least 3 months of expenses',
    'Get basic health insurance to protect against unexpected medical costs',
  ],
  ai_insights: `PERSONALIZED INSIGHTS

- **Income Vulnerability:** Your income stability is moderate, but losing your biggest client could impact over 50% of your revenue. Consider diversifying your client base.
- **Equipment Dependency:** You are very dependent on your equipment. A single hardware failure could halt your work for days.
- **Common Among Freelancers:** Many freelancers in your category face similar challenges with irregular payment cycles.

RISK FACTORS

- **Financial Pressure** – With limited savings, you may struggle to cover 3 months of expenses without income.
- **Health Consideration:** Your overall health rating suggests room for improvement in preventive care.

Based on your profile, we recommend prioritizing income protection and health coverage as your first steps.`,
};

/** Variant with high-risk scores for testing "High Risk" badges */
export const mockHighRiskResponse: AssessmentResponse = {
  ...mockAssessmentResponse,
  overall_score: 85,
  risk_profile: 'High Risk',
  pillar_scores: {
    income: 90,
    client: 85,
    safety: 75,
    equipment: 80,
    health: 72,
  },
};

/** Variant with low-risk scores for testing "Low Risk" badges */
export const mockLowRiskResponse: AssessmentResponse = {
  ...mockAssessmentResponse,
  overall_score: 25,
  risk_profile: 'Low Risk',
  pillar_scores: {
    income: 20,
    client: 30,
    safety: 15,
    equipment: 35,
    health: 25,
  },
};
