import { describe, expect, it } from 'vitest';
import { riskAssessmentResponseSchema } from '@/lib/validators/risk';

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
});
