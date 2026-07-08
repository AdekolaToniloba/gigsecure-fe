import { describe, expect, it } from 'vitest';
import {
  riskAssessmentResponseSchema,
  riskCategoriesResponseSchema,
  riskQuestionsResponseSchema,
  riskRecommendationsResponseSchema,
  techAssessmentInputSchema,
} from '@/lib/validators/risk';
import { mockQuestionsResponse } from '@/__tests__/fixtures/mockQuestions';

const assessment = {
  applicant: {
    first_name: 'Toni',
    last_name: 'Adeyemi',
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
  recommendations: ['Build an emergency fund.'],
  ai_insights: 'Income is moderately stable.',
};

describe('risk validators', () => {
  it('parses the generated assessment contract when recommended categories are omitted', () => {
    expect(riskAssessmentResponseSchema.parse(assessment)).toEqual(assessment);
  });

  it('parses the optional recommended categories field', () => {
    expect(riskAssessmentResponseSchema.parse({
      ...assessment,
      recommended_categories: ['income_protection'],
    }).recommended_categories).toEqual(['income_protection']);
  });

  it.each([
    { overall_score: -0.1 },
    { overall_score: 100.1 },
    { pillar_scores: { ...assessment.pillar_scores, income: -1 } },
    { pillar_scores: { ...assessment.pillar_scores, health: 101 } },
    { overall_score: Number.NaN },
  ])('rejects malformed assessment scores: %o', (override) => {
    expect(riskAssessmentResponseSchema.safeParse({
      ...assessment,
      ...override,
    }).success).toBe(false);
  });

  it('rejects the removed legacy latest-assessment shape', () => {
    expect(riskAssessmentResponseSchema.safeParse({
      id: 'assessment-1',
      user_id: 'user-1',
      score: { score: 68, level: 'medium' },
    }).success).toBe(false);
  });

  it('parses the established discriminated question bank', () => {
    expect(riskQuestionsResponseSchema.parse(mockQuestionsResponse)).toEqual(mockQuestionsResponse);
  });

  it.each([
    {
      ...mockQuestionsResponse,
      steps: [{
        ...mockQuestionsResponse.steps[0],
        questions: [{ id: 'unsupported', text: 'Unsupported', type: 'text' }],
      }],
    },
    {
      ...mockQuestionsResponse,
      steps: [{
        ...mockQuestionsResponse.steps[0],
        questions: [{
          id: 'ranking',
          text: 'Rank these',
          type: 'ranking',
          max_selections: 3,
          options: ['Only one'],
        }],
      }],
    },
    {
      ...mockQuestionsResponse,
      steps: [{
        ...mockQuestionsResponse.steps[0],
        questions: [{
          id: 'rating',
          text: 'Rate this',
          type: 'rating',
          min: 5,
          max: 1,
          labels: {},
        }],
      }],
    },
    {
      ...mockQuestionsResponse,
      steps: [mockQuestionsResponse.steps[0], mockQuestionsResponse.steps[0]],
    },
  ])('rejects malformed question configuration', (value) => {
    expect(riskQuestionsResponseSchema.safeParse(value).success).toBe(false);
  });

  it('accepts only the narrow category shapes already consumed by the wizard', () => {
    expect(riskCategoriesResponseSchema.parse([
      'tech_freelancer',
      { category: 'creative_freelancer' },
    ])).toEqual(['tech_freelancer', { category: 'creative_freelancer' }]);

    expect(riskCategoriesResponseSchema.safeParse([
      { id: 'cat-1', name: 'Tech', slug: 'tech_freelancer' },
    ]).success).toBe(false);
  });

  it('validates the complete assessment payload contract', () => {
    const payload = createPayload();
    expect(techAssessmentInputSchema.parse(payload)).toEqual(payload);
    expect(techAssessmentInputSchema.safeParse({ ...payload, health_rating: 0 }).success).toBe(false);
    expect(techAssessmentInputSchema.safeParse({ ...payload, smoker: 'false' }).success).toBe(false);
    expect(techAssessmentInputSchema.safeParse({ ...payload, email: 'not-in-contract@example.com' }).success).toBe(false);
  });

  it('parses textual recommendations and rejects the stale product array', () => {
    const recommendations = {
      recommendations: ['Diversify your client base.'],
      overall_score: 68.5,
      risk_profile: 'Moderate Risk',
    };
    expect(riskRecommendationsResponseSchema.parse(recommendations)).toEqual(recommendations);
    expect(riskRecommendationsResponseSchema.safeParse([
      { product_id: 'product-1', reason: 'Stale shape' },
    ]).success).toBe(false);
  });
});

function createPayload() {
  return {
    first_name: 'Toni',
    last_name: 'Adeyemi',
    date_of_birth: '15/06/1995',
    gender: 'female',
    state: 'Lagos',
    city: 'Ikeja',
    occupation: 'tech_freelancer',
    marital_status: 'single',
    job_type: 'Web Development',
    freelance_duration: '3-5 years',
    client_geography: 'Global',
    work_mode: 'Fully remote',
    weekly_hours: '20-40',
    monthly_income_band: '₦300,000-₦500,000',
    income_stability: 'Somewhat stable',
    income_sources: '2-3',
    biggest_client_loss: '25-50%',
    past_risks: ['Late payments'],
    top_worries: ['Income interruption'],
    equipment_dependency: 'High',
    pre_existing_conditions: false,
    chronic_illness: false,
    smoker: false,
    health_rating: 4,
    travel_frequency: 'Occasionally',
    survival_3_months: 'Yes',
    savings_duration: '3 months',
    insurance_types: [],
    insurance_claims: 'None',
    protection_priority: 'Income protection',
  };
}
